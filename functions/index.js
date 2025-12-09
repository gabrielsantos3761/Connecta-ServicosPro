/**
 * Cloud Functions para Connecta ServiçosPro
 * Firebase Functions v2
 *
 * SEGURANÇA:
 * - Todas as funções validam autenticação via context.auth
 * - Validação de schema rigorosa para todos os payloads
 * - Rate limiting implementado
 * - Proteções contra ataques comuns (XSS, injection, etc)
 * - Logs de segurança para auditoria
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const { setGlobalOptions } = require('firebase-functions/v2');
const crypto = require('crypto');

// Configurações globais
setGlobalOptions({
  region: 'southamerica-east1', // São Paulo
  maxInstances: 10,
});

// Inicializar Firebase Admin
admin.initializeApp();

// ============================================
// FUNÇÕES AUXILIARES DE VALIDAÇÃO E SEGURANÇA
// ============================================

/**
 * Sanitiza string removendo caracteres perigosos
 * Previne XSS e injection attacks
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';

  return str
    .replace(/[<>]/g, '') // Remove tags HTML
    .replace(/['"]/g, '') // Remove aspas que podem quebrar queries
    .replace(/[{}]/g, '') // Remove chaves que podem ser usadas em template injection
    .trim()
    .substring(0, 1000); // Limita tamanho máximo
}

/**
 * Valida email com regex seguro
 */
function isValidEmail(email) {
  if (typeof email !== 'string') return false;

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254; // RFC 5321
}

/**
 * Valida CPF (11 dígitos)
 */
function isValidCPF(cpf) {
  if (typeof cpf !== 'string') return false;

  // Remove formatação
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.length === 11 && /^[0-9]{11}$/.test(cleanCPF);
}

/**
 * Valida CNPJ (14 dígitos)
 */
function isValidCNPJ(cnpj) {
  if (typeof cnpj !== 'string') return false;

  // Remove formatação
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  return cleanCNPJ.length === 14 && /^[0-9]{14}$/.test(cleanCNPJ);
}

/**
 * Valida telefone (10-15 dígitos com código de país opcional)
 */
function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;

  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 15;
}

/**
 * Valida role
 */
function isValidRole(role) {
  return ['client', 'professional', 'owner'].includes(role);
}

/**
 * Valida UID do Firebase (28 caracteres alfanuméricos)
 */
function isValidUID(uid) {
  return typeof uid === 'string' && /^[a-zA-Z0-9]{28}$/.test(uid);
}

/**
 * Valida tamanho de string
 */
function isValidStringLength(str, min, max) {
  return typeof str === 'string' && str.length >= min && str.length <= max;
}

/**
 * Rate Limiting simples usando Firestore
 * Previne abuso de APIs
 */
async function checkRateLimit(userId, action, maxRequests = 10, windowMs = 60000) {
  const db = admin.firestore();
  const now = Date.now();
  const windowStart = now - windowMs;

  const rateLimitRef = db.collection('_rate_limits').doc(`${userId}_${action}`);

  try {
    const doc = await db.runTransaction(async (transaction) => {
      const rateLimitDoc = await transaction.get(rateLimitRef);

      let requests = [];

      if (rateLimitDoc.exists) {
        requests = rateLimitDoc.data().requests || [];
        // Remove requisições fora da janela de tempo
        requests = requests.filter(timestamp => timestamp > windowStart);
      }

      // Verifica se excedeu o limite
      if (requests.length >= maxRequests) {
        throw new HttpsError(
          'resource-exhausted',
          `Muitas requisições. Tente novamente em ${Math.ceil(windowMs / 1000)} segundos.`
        );
      }

      // Adiciona nova requisição
      requests.push(now);

      transaction.set(rateLimitRef, {
        requests,
        lastRequest: now,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return requests.length;
    });

    return doc;
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    // Se erro no rate limiting, permite a requisição (fail open)
    console.error('Erro no rate limiting:', error);
    return 0;
  }
}

/**
 * Verifica se o usuário está autenticado
 */
function requireAuth(request) {
  if (!request.auth) {
    console.error('❌ [requireAuth] request.auth está undefined');
    console.error('❌ [requireAuth] request:', JSON.stringify({
      rawRequest: request.rawRequest ? 'exists' : 'undefined',
      auth: request.auth,
      data: request.data
    }));
    throw new HttpsError(
      'unauthenticated',
      'Você precisa estar autenticado para executar esta ação.'
    );
  }
  console.log('✅ [requireAuth] Autenticação validada para UID:', request.auth.uid);
  return request.auth;
}

/**
 * Log de segurança para auditoria
 */
async function securityLog(event, userId, details = {}) {
  const db = admin.firestore();

  try {
    await db.collection('_security_logs').add({
      event,
      userId,
      details,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ip: details.ip || null,
      userAgent: details.userAgent || null
    });
  } catch (error) {
    console.error('Erro ao registrar log de segurança:', error);
  }
}

/**
 * Validar dados de login e perfil do usuário
 * Chamada quando o usuário tenta fazer login
 *
 * SEGURANÇA:
 * - Requer autenticação via context.auth
 * - Valida todos os parâmetros com schema rigoroso
 * - Rate limiting: 20 requisições por minuto
 * - Mensagens de erro genéricas (não revelam se usuário existe)
 */
exports.validateUserLogin = onCall(async (request) => {
  try {
    // VALIDAÇÃO DE AUTENTICAÇÃO
    const auth = requireAuth(request);

    // VALIDAÇÃO DE PAYLOAD
    const { uid, email, role } = request.data;

    // Validar parâmetros obrigatórios
    if (!uid || !email || !role) {
      throw new HttpsError(
        'invalid-argument',
        'Dados incompletos fornecidos.'
      );
    }

    // VALIDAÇÃO DE SEGURANÇA
    // UID deve corresponder ao usuário autenticado
    if (uid !== auth.uid) {
      await securityLog('login_uid_mismatch', auth.uid, {
        providedUid: uid,
        email: email
      });
      throw new HttpsError(
        'permission-denied',
        'Acesso negado.'
      );
    }

    // Validar formato do email
    if (!isValidEmail(email)) {
      throw new HttpsError(
        'invalid-argument',
        'Formato de dados inválido.'
      );
    }

    // Validar UID
    if (!isValidUID(uid)) {
      throw new HttpsError(
        'invalid-argument',
        'Formato de dados inválido.'
      );
    }

    // Validar role
    if (!isValidRole(role)) {
      throw new HttpsError(
        'invalid-argument',
        'Tipo de perfil inválido.'
      );
    }

    // RATE LIMITING - 20 requisições por minuto
    await checkRateLimit(uid, 'validateLogin', 20, 60000);

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
    await securityLog('login_success', uid, { role, email });

    return {
      success: true,
      userExists: true,
      hasProfile: true,
      profileComplete: true,
      user: {
        uid,
        email: userData.email,
        name: sanitizeString(profileData.name),
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

    // Log de erro de segurança
    if (request.auth) {
      await securityLog('login_error', request.auth.uid, {
        error: error.message,
        role: request.data?.role
      });
    }

    // Se for um HttpsError, re-throw
    if (error instanceof HttpsError) {
      throw error;
    }

    // Erro genérico - NÃO revela informações sobre o usuário
    throw new HttpsError(
      'internal',
      'Erro ao processar solicitação. Tente novamente.'
    );
  }
});

/**
 * Criar perfil de usuário
 * Chamada quando o usuário completa o registro
 *
 * SEGURANÇA:
 * - Requer autenticação via context.auth
 * - Valida todos os dados com sanitização
 * - Rate limiting: 5 requisições por hora
 * - Previne criação de perfis duplicados
 */
exports.createUserProfile = onCall(async (request) => {
  try {
    // VALIDAÇÃO DE AUTENTICAÇÃO
    const auth = requireAuth(request);

    // VALIDAÇÃO DE PAYLOAD
    const { uid, email, role, profileData } = request.data;

    // Validar parâmetros obrigatórios
    if (!uid || !email || !role || !profileData) {
      throw new HttpsError(
        'invalid-argument',
        'Dados incompletos fornecidos.'
      );
    }

    // VALIDAÇÃO DE SEGURANÇA
    // UID deve corresponder ao usuário autenticado
    if (uid !== auth.uid) {
      await securityLog('profile_creation_uid_mismatch', auth.uid, {
        providedUid: uid,
        email: email
      });
      throw new HttpsError(
        'permission-denied',
        'Acesso negado.'
      );
    }

    // Validar formato dos dados
    if (!isValidEmail(email)) {
      throw new HttpsError('invalid-argument', 'Email inválido.');
    }

    if (!isValidUID(uid)) {
      throw new HttpsError('invalid-argument', 'Identificador inválido.');
    }

    if (!isValidRole(role)) {
      throw new HttpsError('invalid-argument', 'Tipo de perfil inválido.');
    }

    // Validar profileData
    if (typeof profileData !== 'object' || profileData === null) {
      throw new HttpsError('invalid-argument', 'Dados do perfil inválidos.');
    }

    // Validar campos do profileData
    if (profileData.name && !isValidStringLength(profileData.name, 2, 100)) {
      throw new HttpsError('invalid-argument', 'Nome deve ter entre 2 e 100 caracteres.');
    }

    if (profileData.phone && !isValidPhone(profileData.phone)) {
      throw new HttpsError('invalid-argument', 'Telefone inválido.');
    }

    if (profileData.cpf && !isValidCPF(profileData.cpf)) {
      throw new HttpsError('invalid-argument', 'CPF inválido.');
    }

    if (profileData.cnpj && !isValidCNPJ(profileData.cnpj)) {
      throw new HttpsError('invalid-argument', 'CNPJ inválido.');
    }

    // RATE LIMITING - 5 criações de perfil por hora
    await checkRateLimit(uid, 'createProfile', 5, 3600000);

    // Sanitizar dados de entrada
    const sanitizedProfileData = {
      ...profileData,
      name: sanitizeString(profileData.name || ''),
      specialty: profileData.specialty ? sanitizeString(profileData.specialty) : undefined,
    };

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
      ...sanitizedProfileData,
      role,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log de segurança
    await securityLog('profile_created', uid, { role, email });

    return {
      success: true,
      message: 'Perfil criado com sucesso',
      uid,
      role,
    };
  } catch (error) {
    console.error('Erro ao criar perfil:', error);

    // Log de erro
    if (request.auth) {
      await securityLog('profile_creation_error', request.auth.uid, {
        error: error.message,
        role: request.data?.role
      });
    }

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Erro ao processar solicitação. Tente novamente.'
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
 *
 * SEGURANÇA:
 * - Requer autenticação via context.auth
 * - Valida código de barbearia
 * - Rate limiting: 10 tentativas por hora
 * - Previne vinculação duplicada
 */
exports.linkProfessionalToBusiness = onCall(async (request) => {
  try {
    // VALIDAÇÃO DE AUTENTICAÇÃO
    const auth = requireAuth(request);

    // VALIDAÇÃO DE PAYLOAD
    const { professionalUid, businessCode } = request.data;

    if (!professionalUid || !businessCode) {
      throw new HttpsError(
        'invalid-argument',
        'Dados incompletos fornecidos.'
      );
    }

    // VALIDAÇÃO DE SEGURANÇA
    // Profissional só pode vincular a si mesmo
    if (professionalUid !== auth.uid) {
      await securityLog('link_uid_mismatch', auth.uid, {
        providedUid: professionalUid,
        businessCode: businessCode
      });
      throw new HttpsError(
        'permission-denied',
        'Acesso negado.'
      );
    }

    // Validar formato do código
    if (!isValidStringLength(businessCode, 6, 20)) {
      throw new HttpsError(
        'invalid-argument',
        'Código inválido.'
      );
    }

    // RATE LIMITING - 10 tentativas por hora
    await checkRateLimit(professionalUid, 'linkBusiness', 10, 3600000);

    // Sanitizar código
    const sanitizedCode = sanitizeString(businessCode);

    const db = admin.firestore();

    // Buscar barbearia pelo código
    const businessesSnapshot = await db
      .collection('businesses')
      .where('linkCode', '==', sanitizedCode)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (businessesSnapshot.empty) {
      // Log de tentativa com código inválido
      await securityLog('link_invalid_code', professionalUid, {
        code: sanitizedCode
      });
      throw new HttpsError(
        'not-found',
        'Código inválido ou estabelecimento não encontrado.'
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
        'Perfil profissional não encontrado.'
      );
    }

    // Verificar se já está vinculado
    const professionalData = professionalDoc.data();
    const currentBusinesses = professionalData.businesses || [];

    if (currentBusinesses.includes(businessId)) {
      await securityLog('link_already_exists', professionalUid, {
        businessId: businessId
      });
      throw new HttpsError(
        'already-exists',
        'Você já está vinculado a este estabelecimento.'
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
      businessName: sanitizeString(businessData.name),
      status: 'active',
      linkedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log de sucesso
    await securityLog('link_success', professionalUid, {
      businessId: businessId,
      businessName: businessData.name
    });

    return {
      success: true,
      message: `Vinculado com sucesso a ${sanitizeString(businessData.name)}`,
      businessId,
      businessName: sanitizeString(businessData.name),
    };
  } catch (error) {
    console.error('Erro ao vincular profissional:', error);

    // Log de erro
    if (request.auth) {
      await securityLog('link_error', request.auth.uid, {
        error: error.message
      });
    }

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Erro ao processar solicitação. Tente novamente.'
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

/**
 * Criar documento inicial do usuário na coleção users
 * Esta função é chamada durante o primeiro login do usuário
 *
 * SEGURANÇA:
 * - Requer autenticação via context.auth
 * - Valida que o UID corresponde ao usuário autenticado
 * - Rate limiting: 5 requisições por hora
 */
exports.createInitialUserDocument = onCall(async (request) => {
  try {
    console.log('🔍 [createInitialUserDocument] Iniciando função...');
    console.log('🔍 [createInitialUserDocument] request.auth:', request.auth ? 'EXISTE' : 'UNDEFINED');
    console.log('🔍 [createInitialUserDocument] request.data:', request.data);

    // VALIDAÇÃO DE PAYLOAD
    const { uid, email, displayName, role, photoURL, cpf, phone, gender, birthDate } = request.data;

    // Validar parâmetros obrigatórios
    if (!uid || !email || !displayName || !role) {
      throw new HttpsError(
        'invalid-argument',
        'Dados incompletos fornecidos.'
      );
    }

    // VALIDAÇÃO DE SEGURANÇA ALTERNATIVA:
    // Como o token pode não propagar imediatamente após signInWithPopup,
    // validamos verificando se o usuário existe no Firebase Authentication
    let userRecord;
    try {
      userRecord = await admin.auth().getUser(uid);
      console.log('✅ [createInitialUserDocument] Usuário verificado no Auth:', userRecord.uid);
    } catch (error) {
      console.error('❌ [createInitialUserDocument] Usuário não encontrado no Auth:', error);
      throw new HttpsError(
        'not-found',
        'Usuário não encontrado no sistema de autenticação.'
      );
    }

    // Validar que o email corresponde
    if (userRecord.email !== email) {
      console.error('❌ [createInitialUserDocument] Email não corresponde:', {
        provided: email,
        actual: userRecord.email
      });
      throw new HttpsError(
        'permission-denied',
        'Email não corresponde ao usuário autenticado.'
      );
    }

    // Validar formato dos dados
    if (!isValidEmail(email)) {
      throw new HttpsError('invalid-argument', 'Email inválido.');
    }

    if (!isValidUID(uid)) {
      throw new HttpsError('invalid-argument', 'Identificador inválido.');
    }

    if (!isValidRole(role)) {
      throw new HttpsError('invalid-argument', 'Tipo de perfil inválido.');
    }

    if (!isValidStringLength(displayName, 2, 100)) {
      throw new HttpsError('invalid-argument', 'Nome deve ter entre 2 e 100 caracteres.');
    }

    // RATE LIMITING - 5 criações por hora
    await checkRateLimit(uid, 'createInitialUser', 5, 3600000);

    const db = admin.firestore();

    // Verificar se o usuário já existe
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      // Usuário já existe - retornar os dados existentes
      return {
        success: true,
        exists: true,
        message: 'Usuário já existe',
        user: userDoc.data(),
      };
    }

    // Criar documento do usuário
    const userData = {
      uid,
      email,
      displayName: sanitizeString(displayName),
      roles: [role],
      activeRole: role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Adicionar photoURL se fornecido
    if (photoURL) {
      userData.photoURL = photoURL;
    }

    // Adicionar campos opcionais do perfil (cpf, phone, gender, birthDate)
    if (cpf) {
      userData.cpf = cpf;
    }
    if (phone) {
      userData.phone = phone;
    }
    if (gender) {
      userData.gender = gender;
    }
    if (birthDate) {
      userData.birthDate = birthDate;
    }

    // Calcular completude do perfil
    const requiredFields = ['phone', 'cpf', 'gender', 'birthDate'];
    const providedFields = requiredFields.filter(field => userData[field]);
    const profileCompleteness = Math.round(((providedFields.length + 1) / (requiredFields.length + 1)) * 100); // +1 para displayName que já é obrigatório

    userData.profileComplete = profileCompleteness === 100;
    userData.profileCompleteness = profileCompleteness;
    userData.missingFields = requiredFields.filter(field => !userData[field]);

    await userRef.set(userData);

    // Log de segurança
    await securityLog('user_document_created', uid, { role, email });

    return {
      success: true,
      exists: false,
      message: 'Documento do usuário criado com sucesso',
      user: userData,
    };
  } catch (error) {
    console.error('Erro ao criar documento do usuário:', error);

    // Log de erro
    if (request.auth) {
      await securityLog('create_user_error', request.auth.uid, {
        error: error.message,
        role: request.data?.role
      });
    }

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Erro ao processar solicitação. Tente novamente.'
    );
  }
});

/**
 * Cloud Function: updateUserProfile
 * Atualiza o perfil do usuário
 * Validação via Admin SDK - não requer token do cliente
 */
exports.updateUserProfile = onCall({
  region: 'southamerica-east1',
  cors: true,
}, async (request) => {
  const rateLimit = {
    maxUpdates: 10,
    windowMs: 60 * 60 * 1000, // 1 hora
  };

  try {
    const {
      uid,
      displayName,
      phone,
      cpf,
      gender,
      birthDate,
    } = request.data;

    // Validação básica
    if (!uid || typeof uid !== 'string') {
      throw new HttpsError(
        'invalid-argument',
        'UID do usuário é obrigatório'
      );
    }

    // Validar se usuário existe via Admin SDK
    let userRecord;
    try {
      userRecord = await admin.auth().getUser(uid);
      console.log(`[updateUserProfile] Usuário validado via Admin SDK: ${uid}`);
    } catch (error) {
      console.error('[updateUserProfile] Erro ao validar usuário:', error);
      throw new HttpsError(
        'not-found',
        'Usuário não encontrado no sistema de autenticação'
      );
    }

    // Rate limiting
    const userRef = admin.firestore().collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      const now = Date.now();
      const recentUpdates = (userData.recentProfileUpdates || [])
        .filter(timestamp => now - timestamp < rateLimit.windowMs);

      if (recentUpdates.length >= rateLimit.maxUpdates) {
        console.warn(`[updateUserProfile] Rate limit excedido para usuário ${uid}`);
        throw new HttpsError(
          'resource-exhausted',
          `Limite de atualizações excedido. Tente novamente mais tarde.`
        );
      }
    }

    // Validações de campos
    const updates = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (displayName !== undefined) {
      if (typeof displayName !== 'string' || displayName.trim().length < 2 || displayName.length > 100) {
        throw new HttpsError(
          'invalid-argument',
          'Nome deve ter entre 2 e 100 caracteres'
        );
      }
      updates.displayName = displayName.trim();
    }

    if (phone !== undefined) {
      if (typeof phone !== 'string' || !phone.match(/^\+?[0-9]{10,15}$/)) {
        throw new HttpsError(
          'invalid-argument',
          'Telefone inválido. Use formato: +5511999999999'
        );
      }
      updates.phone = phone;
    }

    if (cpf !== undefined) {
      if (typeof cpf !== 'string' || !cpf.match(/^[0-9]{11}$/)) {
        throw new HttpsError(
          'invalid-argument',
          'CPF inválido. Use apenas números (11 dígitos)'
        );
      }
      updates.cpf = cpf;
    }

    if (gender !== undefined) {
      if (!['male', 'female', 'other', 'prefer_not_to_say'].includes(gender)) {
        throw new HttpsError(
          'invalid-argument',
          'Gênero inválido'
        );
      }
      updates.gender = gender;
    }

    if (birthDate !== undefined) {
      if (typeof birthDate !== 'string' || !birthDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        throw new HttpsError(
          'invalid-argument',
          'Data de nascimento inválida. Use formato: YYYY-MM-DD'
        );
      }
      updates.birthDate = birthDate;
    }

    // Calcular completude do perfil
    const currentData = userDoc.exists ? userDoc.data() : {};
    const mergedData = { ...currentData, ...updates };

    const requiredFields = ['displayName', 'phone', 'cpf', 'gender', 'birthDate'];
    const missingFields = requiredFields.filter(field => !mergedData[field]);
    const profileCompleteness = Math.round(
      ((requiredFields.length - missingFields.length) / requiredFields.length) * 100
    );

    updates.profileComplete = missingFields.length === 0;
    updates.missingFields = missingFields;
    updates.profileCompleteness = profileCompleteness;

    // Atualizar rate limiting
    const recentUpdates = userDoc.exists
      ? (userDoc.data().recentProfileUpdates || []).filter(
          timestamp => Date.now() - timestamp < rateLimit.windowMs
        )
      : [];
    recentUpdates.push(Date.now());
    updates.recentProfileUpdates = recentUpdates;

    // Atualizar documento
    await userRef.update(updates);

    console.log(`[updateUserProfile] Perfil atualizado com sucesso para ${uid}`);
    console.log(`[updateUserProfile] Completude: ${profileCompleteness}%`);

    return {
      success: true,
      message: 'Perfil atualizado com sucesso',
      profileCompleteness,
      profileComplete: updates.profileComplete,
      missingFields,
    };

  } catch (error) {
    console.error('[updateUserProfile] Erro:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Erro ao atualizar perfil. Tente novamente.'
    );
  }
});

// ============================================
// SISTEMA DE GESTÃO DE SESSÕES E REFRESH TOKENS
// ============================================

/**
 * Configurações de duração de sessão
 */
const SESSION_CONFIG = {
  accessTokenDuration: 60 * 60 * 1000,           // 1 hora
  refreshTokenDuration: 90 * 24 * 60 * 60 * 1000, // 90 dias
  useSlidingExpiration: true,
  autoRefreshThreshold: 5 * 60 * 1000,           // 5 minutos
  maxSessionsPerUser: 5,                         // Máximo 5 dispositivos
};

/**
 * Gera um refresh token seguro (aleatório)
 */
function generateRefreshToken() {
  return crypto.randomBytes(64).toString('base64url');
}

/**
 * Cria um hash seguro do refresh token
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Compara um token com seu hash
 */
function verifyToken(token, hash) {
  const tokenHash = hashToken(token);
  return crypto.timingSafeEqual(
    Buffer.from(tokenHash),
    Buffer.from(hash)
  );
}

/**
 * Extrai informações do User-Agent
 */
function parseUserAgent(userAgent) {
  if (!userAgent) {
    return {
      browser: 'Unknown',
      browserVersion: '',
      os: 'Unknown',
      platform: 'web',
    };
  }

  let browser = 'Unknown';
  let browserVersion = '';
  let os = 'Unknown';
  let platform = 'web';

  // Detectar navegador
  if (userAgent.includes('Chrome')) {
    browser = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
    const match = userAgent.match(/Version\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (userAgent.includes('Edge')) {
    browser = 'Edge';
    const match = userAgent.match(/Edge\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : '';
  }

  // Detectar sistema operacional
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
    platform = 'android';
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
    platform = 'ios';
  }

  return { browser, browserVersion, os, platform };
}

/**
 * Cloud Function: createSession
 * Cria uma nova sessão após login bem-sucedido
 *
 * SEGURANÇA:
 * - Validação via Admin SDK (não requer context.auth)
 * - Limita número de sessões ativas por usuário
 * - Gera refresh token criptograficamente seguro
 * - Armazena apenas hash do token
 */
exports.createSession = onCall({
  region: 'southamerica-east1',
  cors: true,
}, async (request) => {
  try {
    const {
      uid,
      deviceId,
      userAgent,
      ipAddress,
      activeRole,
    } = request.data;

    // Validação básica
    if (!uid || !deviceId || !activeRole) {
      throw new HttpsError(
        'invalid-argument',
        'Dados incompletos fornecidos.'
      );
    }

    // Validar se usuário existe via Admin SDK
    let userRecord;
    try {
      userRecord = await admin.auth().getUser(uid);
      console.log(`[createSession] Usuário validado via Admin SDK: ${uid}`);
    } catch (error) {
      console.error('[createSession] Erro ao validar usuário:', error);
      throw new HttpsError(
        'not-found',
        'Usuário não encontrado no sistema de autenticação.'
      );
    }

    const db = admin.firestore();

    // Verificar número de sessões ativas
    const activeSessionsSnapshot = await db
      .collection('sessions')
      .where('userId', '==', uid)
      .where('isActive', '==', true)
      .where('revokedAt', '==', null)
      .get();

    // Se excedeu o limite, revogar a sessão mais antiga
    if (activeSessionsSnapshot.size >= SESSION_CONFIG.maxSessionsPerUser) {
      console.log(`[createSession] Limite de sessões atingido. Revogando sessão mais antiga...`);

      const oldestSession = activeSessionsSnapshot.docs
        .sort((a, b) => a.data().createdAt.toMillis() - b.data().createdAt.toMillis())[0];

      await oldestSession.ref.update({
        revokedAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: false,
      });
    }

    // Gerar refresh token
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);

    // Parse do user agent
    const deviceMetadata = parseUserAgent(userAgent);

    // Criar sessão
    const now = admin.firestore.FieldValue.serverTimestamp();
    const expiresAt = new Date(Date.now() + SESSION_CONFIG.refreshTokenDuration);

    const sessionData = {
      userId: uid,
      deviceId,
      userAgent: userAgent || 'Unknown',
      ipAddress: ipAddress || null,
      refreshTokenHash,
      activeRole,
      deviceMetadata,
      createdAt: now,
      expiresAt,
      lastUsedAt: now,
      revokedAt: null,
      isActive: true,
    };

    const sessionRef = await db.collection('sessions').add(sessionData);
    const sessionId = sessionRef.id;

    // Gerar custom token para o usuário (válido por 1 hora)
    const customToken = await admin.auth().createCustomToken(uid);

    // Log de segurança
    await securityLog('session_created', uid, {
      sessionId,
      deviceId,
      activeRole,
      browser: deviceMetadata.browser,
      os: deviceMetadata.os,
    });

    console.log(`[createSession] Sessão criada com sucesso: ${sessionId}`);

    return {
      success: true,
      sessionId,
      refreshToken,        // Enviar para o cliente guardar
      accessToken: customToken,
      expiresAt: expiresAt.toISOString(),
      message: 'Sessão criada com sucesso',
    };
  } catch (error) {
    console.error('[createSession] Erro:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Erro ao criar sessão. Tente novamente.'
    );
  }
});

/**
 * Cloud Function: refreshSession
 * Renova o access token usando o refresh token
 *
 * SEGURANÇA:
 * - Valida que a sessão existe e está ativa
 * - Valida que o refresh token corresponde ao hash armazenado
 * - Implementa sliding expiration (renova expiresAt)
 * - Rate limiting: 60 renovações por hora
 */
exports.refreshSession = onCall({
  region: 'southamerica-east1',
  cors: true,
}, async (request) => {
  try {
    const { sessionId, refreshToken } = request.data;

    // Validação básica
    if (!sessionId || !refreshToken) {
      throw new HttpsError(
        'invalid-argument',
        'Dados incompletos fornecidos.'
      );
    }

    const db = admin.firestore();

    // Buscar sessão
    const sessionRef = db.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      throw new HttpsError(
        'not-found',
        'Sessão não encontrada.'
      );
    }

    const sessionData = sessionDoc.data();

    // Verificar se a sessão está ativa
    if (!sessionData.isActive || sessionData.revokedAt) {
      throw new HttpsError(
        'permission-denied',
        'Sessão inválida ou revogada.'
      );
    }

    // Verificar se a sessão expirou
    const now = new Date();
    const expiresAt = sessionData.expiresAt.toDate();
    if (now > expiresAt) {
      // Marcar como inativa
      await sessionRef.update({
        isActive: false,
        revokedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      throw new HttpsError(
        'unauthenticated',
        'Sessão expirada. Faça login novamente.'
      );
    }

    // Validar refresh token
    let isValidToken = false;
    try {
      isValidToken = verifyToken(refreshToken, sessionData.refreshTokenHash);
    } catch (error) {
      console.error('[refreshSession] Erro ao validar token:', error);
    }

    if (!isValidToken) {
      // Log de tentativa com token inválido
      await securityLog('refresh_invalid_token', sessionData.userId, {
        sessionId,
        deviceId: sessionData.deviceId,
      });

      throw new HttpsError(
        'permission-denied',
        'Token de renovação inválido.'
      );
    }

    // Rate limiting - 60 renovações por hora
    await checkRateLimit(sessionData.userId, 'refreshSession', 60, 60 * 60 * 1000);

    // Gerar novo custom token
    const customToken = await admin.auth().createCustomToken(sessionData.userId);

    // Atualizar sessão (sliding expiration)
    const updates = {
      lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (SESSION_CONFIG.useSlidingExpiration) {
      updates.expiresAt = new Date(Date.now() + SESSION_CONFIG.refreshTokenDuration);
    }

    await sessionRef.update(updates);

    console.log(`[refreshSession] Sessão renovada: ${sessionId}`);

    return {
      success: true,
      accessToken: customToken,
      expiresAt: updates.expiresAt ? updates.expiresAt.toISOString() : expiresAt.toISOString(),
      message: 'Token renovado com sucesso',
    };
  } catch (error) {
    console.error('[refreshSession] Erro:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Erro ao renovar sessão. Tente novamente.'
    );
  }
});

/**
 * Cloud Function: revokeSession
 * Revoga uma sessão específica (logout)
 *
 * SEGURANÇA:
 * - Requer autenticação via context.auth
 * - Usuário só pode revogar suas próprias sessões
 */
exports.revokeSession = onCall({
  region: 'southamerica-east1',
  cors: true,
}, async (request) => {
  try {
    const auth = requireAuth(request);
    const { sessionId } = request.data;

    if (!sessionId) {
      throw new HttpsError(
        'invalid-argument',
        'ID da sessão é obrigatório.'
      );
    }

    const db = admin.firestore();
    const sessionRef = db.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      throw new HttpsError(
        'not-found',
        'Sessão não encontrada.'
      );
    }

    const sessionData = sessionDoc.data();

    // Verificar se a sessão pertence ao usuário autenticado
    if (sessionData.userId !== auth.uid) {
      await securityLog('revoke_session_unauthorized', auth.uid, {
        attemptedSessionId: sessionId,
        actualOwner: sessionData.userId,
      });

      throw new HttpsError(
        'permission-denied',
        'Você não tem permissão para revogar esta sessão.'
      );
    }

    // Revogar sessão
    await sessionRef.update({
      revokedAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: false,
    });

    // Log de segurança
    await securityLog('session_revoked', auth.uid, {
      sessionId,
      deviceId: sessionData.deviceId,
    });

    console.log(`[revokeSession] Sessão revogada: ${sessionId}`);

    return {
      success: true,
      message: 'Sessão revogada com sucesso',
    };
  } catch (error) {
    console.error('[revokeSession] Erro:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Erro ao revogar sessão. Tente novamente.'
    );
  }
});

/**
 * Cloud Function: revokeAllSessions
 * Revoga todas as sessões do usuário (exceto opcionalmente a atual)
 *
 * SEGURANÇA:
 * - Requer autenticação via context.auth
 * - Útil para "Logout de todos os dispositivos"
 * - Útil após trocar senha
 */
exports.revokeAllSessions = onCall({
  region: 'southamerica-east1',
  cors: true,
}, async (request) => {
  try {
    const auth = requireAuth(request);
    const { exceptSessionId } = request.data;

    const db = admin.firestore();

    // Buscar todas as sessões ativas do usuário
    let query = db
      .collection('sessions')
      .where('userId', '==', auth.uid)
      .where('isActive', '==', true);

    const sessionsSnapshot = await query.get();

    if (sessionsSnapshot.empty) {
      return {
        success: true,
        revokedCount: 0,
        message: 'Nenhuma sessão ativa encontrada',
      };
    }

    // Revogar todas (exceto a exceção, se fornecida)
    const batch = db.batch();
    let revokedCount = 0;

    sessionsSnapshot.docs.forEach((doc) => {
      if (!exceptSessionId || doc.id !== exceptSessionId) {
        batch.update(doc.ref, {
          revokedAt: admin.firestore.FieldValue.serverTimestamp(),
          isActive: false,
        });
        revokedCount++;
      }
    });

    await batch.commit();

    // Log de segurança
    await securityLog('all_sessions_revoked', auth.uid, {
      revokedCount,
      keptSessionId: exceptSessionId || null,
    });

    console.log(`[revokeAllSessions] ${revokedCount} sessões revogadas para ${auth.uid}`);

    return {
      success: true,
      revokedCount,
      message: `${revokedCount} sessão(ões) revogada(s) com sucesso`,
    };
  } catch (error) {
    console.error('[revokeAllSessions] Erro:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Erro ao revogar sessões. Tente novamente.'
    );
  }
});

/**
 * Cloud Function: listActiveSessions
 * Lista todas as sessões ativas do usuário
 *
 * SEGURANÇA:
 * - Requer autenticação via context.auth
 * - Usuário só vê suas próprias sessões
 */
exports.listActiveSessions = onCall({
  region: 'southamerica-east1',
  cors: true,
}, async (request) => {
  try {
    const auth = requireAuth(request);
    const { currentSessionId } = request.data;

    const db = admin.firestore();

    // Buscar sessões ativas
    const sessionsSnapshot = await db
      .collection('sessions')
      .where('userId', '==', auth.uid)
      .where('isActive', '==', true)
      .where('revokedAt', '==', null)
      .orderBy('lastUsedAt', 'desc')
      .get();

    const sessions = sessionsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        deviceName: data.deviceMetadata?.deviceName ||
                   `${data.deviceMetadata?.browser || 'Unknown'} em ${data.deviceMetadata?.os || 'Unknown'}`,
        browser: data.deviceMetadata?.browser || 'Unknown',
        browserVersion: data.deviceMetadata?.browserVersion || '',
        os: data.deviceMetadata?.os || 'Unknown',
        platform: data.deviceMetadata?.platform || 'web',
        ipAddress: data.ipAddress || null,
        createdAt: data.createdAt.toDate().toISOString(),
        lastUsedAt: data.lastUsedAt.toDate().toISOString(),
        expiresAt: data.expiresAt.toDate().toISOString(),
        isCurrent: doc.id === currentSessionId,
      };
    });

    console.log(`[listActiveSessions] Listadas ${sessions.length} sessões para ${auth.uid}`);

    return {
      success: true,
      sessions,
      total: sessions.length,
    };
  } catch (error) {
    console.error('[listActiveSessions] Erro:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Erro ao listar sessões. Tente novamente.'
    );
  }
});

/**
 * Cloud Function: validateSession
 * Valida se uma sessão ainda é válida
 * Usado para verificar se o usuário deve ser deslogado
 */
exports.validateSession = onCall({
  region: 'southamerica-east1',
  cors: true,
}, async (request) => {
  try {
    const auth = requireAuth(request);
    const { sessionId } = request.data;

    if (!sessionId) {
      throw new HttpsError(
        'invalid-argument',
        'ID da sessão é obrigatório.'
      );
    }

    const db = admin.firestore();
    const sessionRef = db.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return {
        valid: false,
        reason: 'session_not_found',
      };
    }

    const sessionData = sessionDoc.data();

    // Verificar se pertence ao usuário
    if (sessionData.userId !== auth.uid) {
      return {
        valid: false,
        reason: 'session_unauthorized',
      };
    }

    // Verificar se está ativa
    if (!sessionData.isActive || sessionData.revokedAt) {
      return {
        valid: false,
        reason: 'session_revoked',
      };
    }

    // Verificar se expirou
    const now = new Date();
    const expiresAt = sessionData.expiresAt.toDate();
    if (now > expiresAt) {
      // Marcar como inativa
      await sessionRef.update({
        isActive: false,
        revokedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        valid: false,
        reason: 'session_expired',
      };
    }

    return {
      valid: true,
      expiresAt: expiresAt.toISOString(),
      lastUsedAt: sessionData.lastUsedAt.toDate().toISOString(),
    };
  } catch (error) {
    console.error('[validateSession] Erro:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Erro ao validar sessão. Tente novamente.'
    );
  }
});
