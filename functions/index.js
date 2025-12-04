/**
 * Cloud Functions para Connecta ServiçosPro
 * Firebase Functions v2
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const { setGlobalOptions } = require('firebase-functions/v2');

// Configurações globais
setGlobalOptions({
  region: 'southamerica-east1', // São Paulo
  maxInstances: 10,
});

// Inicializar Firebase Admin
admin.initializeApp();

/**
 * Validar dados de login e perfil do usuário
 * Chamada quando o usuário tenta fazer login
 */
exports.validateUserLogin = onCall(async (request) => {
  try {
    const { uid, email, role } = request.data;

    // Validar parâmetros
    if (!uid || !email || !role) {
      throw new HttpsError(
        'invalid-argument',
        'UID, email e role são obrigatórios'
      );
    }

    // Validar role
    const validRoles = ['client', 'professional', 'owner'];
    if (!validRoles.includes(role)) {
      throw new HttpsError(
        'invalid-argument',
        'Role inválido. Deve ser: client, professional ou owner'
      );
    }

    const db = admin.firestore();

    // Verificar se o usuário existe no Firestore
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      // Usuário não existe no Firestore - primeira vez fazendo login
      return {
        success: false,
        userExists: false,
        hasProfile: false,
        message: 'Usuário não encontrado. É necessário completar o cadastro.',
        redirectTo: '/register',
      };
    }

    const userData = userDoc.data();

    // Verificar se o usuário tem o perfil (profile) criado
    const profileDoc = await db
      .collection('users')
      .doc(uid)
      .collection('profiles')
      .doc(role)
      .get();

    if (!profileDoc.exists) {
      // Usuário existe mas não tem perfil para este role
      return {
        success: false,
        userExists: true,
        hasProfile: false,
        availableRoles: userData.roles || [],
        message: `Perfil de ${role} não encontrado. Complete seu cadastro como ${role}.`,
        redirectTo: '/register',
      };
    }

    const profileData = profileDoc.data();

    // Validar se o perfil está completo
    const requiredFields = getRequiredFieldsForRole(role);
    const missingFields = requiredFields.filter(
      field => !profileData[field] || profileData[field] === ''
    );

    if (missingFields.length > 0) {
      return {
        success: false,
        userExists: true,
        hasProfile: true,
        profileComplete: false,
        missingFields,
        message: `Perfil incompleto. Campos faltando: ${missingFields.join(', ')}`,
        redirectTo: '/register',
      };
    }

    // Verificar status do perfil (se aplicável)
    if (profileData.status && profileData.status !== 'active') {
      return {
        success: false,
        userExists: true,
        hasProfile: true,
        profileComplete: true,
        profileStatus: profileData.status,
        message: `Perfil ${profileData.status}. Entre em contato com o suporte.`,
      };
    }

    // Login válido - retornar dados do usuário
    return {
      success: true,
      userExists: true,
      hasProfile: true,
      profileComplete: true,
      user: {
        uid,
        email: userData.email,
        name: profileData.name,
        avatar: profileData.avatar || null,
        phone: profileData.phone || null,
        activeRole: role,
        roles: userData.roles || [role],
        createdAt: userData.createdAt,
      },
      profile: profileData,
      message: 'Login validado com sucesso',
    };
  } catch (error) {
    console.error('Erro na validação de login:', error);

    // Se for um HttpsError, re-throw
    if (error instanceof HttpsError) {
      throw error;
    }

    // Erro genérico
    throw new HttpsError(
      'internal',
      'Erro ao validar login',
      error.message
    );
  }
});

/**
 * Criar perfil de usuário
 * Chamada quando o usuário completa o registro
 */
exports.createUserProfile = onCall(async (request) => {
  try {
    const { uid, email, role, profileData } = request.data;

    // Validar parâmetros
    if (!uid || !email || !role || !profileData) {
      throw new HttpsError(
        'invalid-argument',
        'Todos os campos são obrigatórios'
      );
    }

    const db = admin.firestore();

    // Criar ou atualizar documento do usuário
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Criar novo usuário
      await userRef.set({
        email,
        roles: [role],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Adicionar role se não existir
      const userData = userDoc.data();
      const roles = userData.roles || [];
      if (!roles.includes(role)) {
        await userRef.update({
          roles: admin.firestore.FieldValue.arrayUnion(role),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    // Criar perfil
    const profileRef = userRef.collection('profiles').doc(role);
    await profileRef.set({
      ...profileData,
      role,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: 'Perfil criado com sucesso',
      uid,
      role,
    };
  } catch (error) {
    console.error('Erro ao criar perfil:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Erro ao criar perfil',
      error.message
    );
  }
});

/**
 * Trigger: Executado quando um novo usuário é criado
 * Envia email de boas-vindas, cria documentos iniciais, etc.
 */
exports.onUserCreated = onDocumentCreated('users/{userId}', async (event) => {
  const userData = event.data.data();
  const userId = event.params.userId;

  console.log('Novo usuário criado:', userId, userData);

  // Aqui você pode adicionar lógica adicional:
  // - Enviar email de boas-vindas
  // - Criar documentos relacionados
  // - Notificar admins
  // - etc.

  return null;
});

/**
 * Validar e associar profissional a uma barbearia
 */
exports.linkProfessionalToBusiness = onCall(async (request) => {
  try {
    const { professionalUid, businessCode } = request.data;

    if (!professionalUid || !businessCode) {
      throw new HttpsError(
        'invalid-argument',
        'UID do profissional e código da barbearia são obrigatórios'
      );
    }

    const db = admin.firestore();

    // Buscar barbearia pelo código
    const businessesSnapshot = await db
      .collection('businesses')
      .where('linkCode', '==', businessCode)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (businessesSnapshot.empty) {
      throw new HttpsError(
        'not-found',
        'Código inválido ou estabelecimento não encontrado'
      );
    }

    const businessDoc = businessesSnapshot.docs[0];
    const businessId = businessDoc.id;
    const businessData = businessDoc.data();

    // Verificar se o profissional existe
    const professionalDoc = await db
      .collection('users')
      .doc(professionalUid)
      .collection('profiles')
      .doc('professional')
      .get();

    if (!professionalDoc.exists) {
      throw new HttpsError(
        'not-found',
        'Perfil profissional não encontrado'
      );
    }

    // Verificar se já está vinculado
    const professionalData = professionalDoc.data();
    const currentBusinesses = professionalData.businesses || [];

    if (currentBusinesses.includes(businessId)) {
      throw new HttpsError(
        'already-exists',
        'Você já está vinculado a este estabelecimento'
      );
    }

    // Adicionar barbearia ao array de businesses do profissional
    await db
      .collection('users')
      .doc(professionalUid)
      .collection('profiles')
      .doc('professional')
      .update({
        businesses: admin.firestore.FieldValue.arrayUnion(businessId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // Adicionar profissional à lista de profissionais da barbearia
    await db.collection('businesses').doc(businessId).update({
      professionals: admin.firestore.FieldValue.arrayUnion(professionalUid),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Criar registro de vínculo
    await db.collection('business_professional_links').add({
      businessId,
      professionalUid,
      businessName: businessData.name,
      status: 'active',
      linkedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: `Vinculado com sucesso a ${businessData.name}`,
      businessId,
      businessName: businessData.name,
    };
  } catch (error) {
    console.error('Erro ao vincular profissional:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Erro ao vincular profissional',
      error.message
    );
  }
});

/**
 * Função auxiliar: Retorna campos obrigatórios por tipo de perfil
 */
function getRequiredFieldsForRole(role) {
  const requiredFields = {
    client: ['name', 'phone'],
    professional: ['name', 'phone', 'specialty'],
    owner: ['name', 'phone', 'cpfCnpj'],
  };

  return requiredFields[role] || ['name'];
}
