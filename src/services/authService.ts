// Authentication Service with Firebase - Multi-Role Support
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { validateUserLogin as validateLoginFunction, createInitialUserDocument as createInitialUserDocumentFunction } from './functionsService';

export type UserRole = 'client' | 'professional' | 'owner';

// Interface principal do usuário (coleção users)
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  roles: UserRole[]; // Array de roles que o usuário possui
  activeRole: UserRole; // Role ativo no momento
  photoURL?: string;
  coverPhotoURL?: string;
  phone?: string;
  cpf?: string;
  gender?: string;
  birthDate?: string;
  createdAt: any;
  updatedAt: any;
  // Informações adicionais do Google/Facebook
  firstName?: string; // Nome
  lastName?: string; // Sobrenome
  locale?: string; // Localidade/idioma (ex: pt-BR, en-US)
  emailVerified?: boolean; // Email verificado
  metadata?: {
    creationTime?: string; // Data de criação da conta
    lastSignInTime?: string; // Último login
  };
  providers?: Array<{
    providerId: string; // google.com, facebook.com, etc
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    phoneNumber: string | null;
  }>;
}

// Interface para dados específicos de profissional
export interface ProfessionalProfile {
  userId: string;
  cnpj?: string;
  specialties?: string[];
  barbershopId?: string;
  workSchedule?: any;
  rating?: number;
  reviewsCount?: number;
  servicesCompleted?: number;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

// Interface para dados específicos de proprietário
export interface OwnerProfile {
  userId: string;
  cnpj?: string;
  businesses: string[]; // IDs das empresas
  plan: 'free' | 'basic' | 'premium';
  subscriptionStatus: 'active' | 'inactive' | 'trial';
  subscriptionEndsAt?: any;
  createdAt: any;
  updatedAt: any;
}

// Providers
const googleProvider = new GoogleAuthProvider();
// Adicionar escopos para obter mais informações do usuário
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.addScope('https://www.googleapis.com/auth/user.birthday.read');
googleProvider.addScope('https://www.googleapis.com/auth/user.phonenumbers.read');
googleProvider.addScope('https://www.googleapis.com/auth/user.gender.read');

const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');
facebookProvider.addScope('user_birthday');
facebookProvider.addScope('user_gender');

/**
 * Cria um perfil de usuário no Firestore (coleção users)
 * SOLUÇÃO TEMPORÁRIA: Usando Cloud Function devido a problemas de conectividade com Firestore do cliente
 */
async function createUserProfile(
  user: FirebaseUser,
  role: UserRole,
  additionalData?: any
): Promise<void> {
  try {
    const displayName = user.displayName || user.email!.split('@')[0];
    const photoURL = additionalData?.photoURL || user.photoURL || undefined;

    const result = await createInitialUserDocumentFunction(
      user.uid,
      user.email!,
      displayName,
      role,
      photoURL,
      user
    );

    if (!result.success) {
      throw new Error(result.message || 'Erro ao criar documento do usuário');
    }
  } catch (error: any) {
    console.error('[createUserProfile] Erro ao criar documento:', error.message);
    throw error;
  }
}

/**
 * Cria perfil de profissional (coleção professionals)
 */
async function createProfessionalProfile(
  userId: string,
  cnpj?: string
): Promise<void> {
  console.log('📝 [createProfessionalProfile] Criando perfil de profissional para UID:', userId);
  const professionalRef = doc(db, 'professionals', userId);

  const professionalProfile: ProfessionalProfile = {
    userId,
    cnpj,
    specialties: [],
    isActive: true,
    servicesCompleted: 0,
    reviewsCount: 0,
    rating: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(professionalRef, professionalProfile);
    console.log('✅ [createProfessionalProfile] Perfil de profissional criado!');
  } catch (error) {
    console.error('❌ [createProfessionalProfile] Erro:', error);
    throw error;
  }
}

/**
 * Cria perfil de proprietário (coleção owners)
 */
async function createOwnerProfile(
  userId: string,
  cnpj?: string
): Promise<void> {
  console.log('📝 [createOwnerProfile] Criando perfil de proprietário para UID:', userId);
  const ownerRef = doc(db, 'owners', userId);

  const ownerProfile: OwnerProfile = {
    userId,
    cnpj,
    businesses: [],
    plan: 'free',
    subscriptionStatus: 'trial',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(ownerRef, ownerProfile);
    console.log('✅ [createOwnerProfile] Perfil de proprietário criado!');
  } catch (error) {
    console.error('❌ [createOwnerProfile] Erro:', error);
    throw error;
  }
}

/**
 * Obtém o perfil do usuário do Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }

  return null;
}

/**
 * Obtém o perfil de profissional
 */
export async function getProfessionalProfile(uid: string): Promise<ProfessionalProfile | null> {
  const professionalRef = doc(db, 'professionals', uid);
  const professionalSnap = await getDoc(professionalRef);

  if (professionalSnap.exists()) {
    return professionalSnap.data() as ProfessionalProfile;
  }

  return null;
}

/**
 * Obtém o perfil de proprietário
 */
export async function getOwnerProfile(uid: string): Promise<OwnerProfile | null> {
  const ownerRef = doc(db, 'owners', uid);
  const ownerSnap = await getDoc(ownerRef);

  if (ownerSnap.exists()) {
    return ownerSnap.data() as OwnerProfile;
  }

  return null;
}

/**
 * Adiciona um novo role ao usuário
 */
export async function addRoleToUser(
  uid: string,
  newRole: UserRole,
  cnpj?: string
): Promise<void> {
  console.log(`📝 [addRoleToUser] Adicionando role ${newRole} para UID:`, uid);

  const userProfile = await getUserProfile(uid);
  if (!userProfile) throw new Error('Usuário não encontrado');

  // Verifica se já tem esse role
  if (userProfile.roles.includes(newRole)) {
    console.log('⚠️ [addRoleToUser] Usuário já possui este role');
    return;
  }

  // Adiciona o role ao array
  const updatedRoles = [...userProfile.roles, newRole];

  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    roles: updatedRoles,
    updatedAt: serverTimestamp()
  });

  // Cria o perfil específico na coleção correspondente
  if (newRole === 'professional') {
    await createProfessionalProfile(uid, cnpj);
  } else if (newRole === 'owner') {
    await createOwnerProfile(uid, cnpj);
  }

  console.log('✅ [addRoleToUser] Role adicionado com sucesso!');
}

/**
 * Alterna o role ativo do usuário
 */
export async function switchActiveRole(uid: string, newActiveRole: UserRole): Promise<void> {
  console.log(`📝 [switchActiveRole] Alternando para role ${newActiveRole}`);

  const userProfile = await getUserProfile(uid);
  if (!userProfile) throw new Error('Usuário não encontrado');

  // Verifica se o usuário possui esse role
  if (!userProfile.roles.includes(newActiveRole)) {
    throw new Error(`Usuário não possui o role ${newActiveRole}`);
  }

  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    activeRole: newActiveRole,
    updatedAt: serverTimestamp()
  });

  console.log('✅ [switchActiveRole] Role ativo alterado com sucesso!');
}

/**
 * Registra um novo usuário com email e senha
 */
export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
  role: UserRole = 'client',
  additionalData?: any
): Promise<UserProfile> {
  try {
    console.log('📝 [authService] Criando usuário no Authentication...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ [authService] Usuário criado no Authentication:', user.uid);

    console.log('📝 [authService] Atualizando displayName...');
    await updateProfile(user, { displayName });
    console.log('✅ [authService] DisplayName atualizado');

    // Extrai o CNPJ do additionalData se existir
    const { cnpj, ...otherData } = additionalData || {};

    console.log('📝 [authService] Criando perfil no Firestore...');
    await createUserProfile(user, role, { displayName, ...otherData });
    console.log('✅ [authService] Perfil criado no Firestore');

    // Se for professional ou owner, cria os perfis específicos
    if (role === 'professional') {
      await createProfessionalProfile(user.uid, cnpj);
    } else if (role === 'owner') {
      await createOwnerProfile(user.uid, cnpj);
    }

    console.log('📝 [authService] Buscando perfil do usuário...');
    const profile = await getUserProfile(user.uid);
    if (!profile) {
      console.error('❌ [authService] Perfil não encontrado após criação');
      throw new Error('Erro ao criar perfil do usuário');
    }

    console.log('✅ [authService] Perfil encontrado:', profile);
    return profile;
  } catch (error: any) {
    console.error('❌ [authService] Erro:', error);

    // Se o email já existe, retorna uma mensagem especial informando sobre o login
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Este email já está em uso. Faça login para adicionar um novo tipo de conta.');
    }

    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Faz login com email e senha
 */
export async function loginWithEmail(
  email: string,
  password: string,
  expectedRole?: UserRole
): Promise<UserProfile> {
  try {
    console.log('📝 [loginWithEmail] Iniciando login...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ [loginWithEmail] Autenticação bem-sucedida, UID:', user.uid);

    // Validar login usando Cloud Function
    if (expectedRole) {
      console.log('📝 [loginWithEmail] Validando perfil via Cloud Function...');
      try {
        const validation = await validateLoginFunction(user.uid, email, expectedRole);

        console.log('📊 [loginWithEmail] Resultado da validação:', validation);

        if (!validation.success) {
          // Usuário não tem perfil completo
          console.warn('⚠️ [loginWithEmail] Perfil incompleto:', validation.message);
          throw new Error(validation.message);
        }

        // Retornar perfil validado
        if (validation.user) {
          return {
            uid: validation.user.uid,
            email: validation.user.email,
            displayName: validation.user.name,
            roles: validation.user.roles as UserRole[],
            activeRole: validation.user.activeRole as UserRole,
            photoURL: validation.user.avatar || undefined,
            phone: validation.user.phone || undefined,
            createdAt: validation.user.createdAt,
            updatedAt: serverTimestamp(),
          };
        }
      } catch (funcError: any) {
        console.error('❌ [loginWithEmail] Erro na Cloud Function, usando fallback:', funcError);
        // Continuar com o método antigo se a Cloud Function falhar
      }
    }

    // Fallback: buscar perfil do Firestore (caso expectedRole não seja fornecido ou Cloud Function falhe)
    let profile = await getUserProfile(user.uid);

    // Se o perfil não existir, retorna erro (usuário deve se registrar primeiro)
    if (!profile) {
      console.error('❌ [loginWithEmail] Perfil não encontrado. Usuário deve se registrar primeiro.');
      throw new Error('Usuário não encontrado. Por favor, faça seu cadastro primeiro.');
    }

    // SEGURANÇA: Verificar se o usuário possui o role esperado
    if (expectedRole && !profile.roles.includes(expectedRole)) {
      console.error(`❌ [loginWithEmail] Usuário não possui o role ${expectedRole}`);
      throw new Error(`Você não possui perfil de ${expectedRole}. Complete seu cadastro como ${expectedRole} primeiro.`);
    }

    // Se o usuário possui o role, mas não está ativo, alterna
    if (expectedRole && profile.activeRole !== expectedRole) {
      await switchActiveRole(user.uid, expectedRole);
      profile = await getUserProfile(user.uid);
    }

    return profile!;
  } catch (error: any) {
    console.error('❌ [loginWithEmail] Erro:', error);
    throw new Error(getAuthErrorMessage(error.code) || error.message);
  }
}

/**
 * Login com Google
 * Implementa vinculação automática de credenciais para evitar contas duplicadas
 */
export async function loginWithGoogle(role: UserRole = 'client'): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Extrair informações adicionais do credential (se disponível)
    const additionalUserInfo: any = {};

    // IMPORTANTE: A foto vem direto do user.photoURL (Firebase já processa)
    if (user.photoURL) {
      additionalUserInfo.photoURL = user.photoURL;
    }

    // O Google pode retornar informações adicionais no resultado
    if ((result as any).additionalUserInfo?.profile) {
      const googleProfile = (result as any).additionalUserInfo.profile;

      // Capturar informações extras do Google
      if (googleProfile.given_name) additionalUserInfo.firstName = googleProfile.given_name;
      if (googleProfile.family_name) additionalUserInfo.lastName = googleProfile.family_name;
      if (googleProfile.locale) additionalUserInfo.locale = googleProfile.locale;
      // Foto de alta qualidade do Google (sobrescreve se disponível)
      if (googleProfile.picture) additionalUserInfo.photoURL = googleProfile.picture;
    }

    let profile = await getUserProfile(user.uid);

    // REGRA DE NEGÓCIO:
    // - Se é a PRIMEIRA VEZ do usuário (não tem perfil), cria com o role selecionado
    // - Se JÁ TEM perfil, permite login em QUALQUER role (não restringe)
    //   e oferece opção de adicionar novo role depois
    if (!profile) {
      // Primeira vez - cria o perfil com o role selecionado
      await createUserProfile(user, role, additionalUserInfo);
      profile = await getUserProfile(user.uid);
    } else {
      // Já tem perfil - permite login e atualiza informações
      console.log('[loginWithGoogle] Usuário já possui perfil, atualizando informações...');
      const userRef = doc(db, 'users', user.uid);
      const updateData: any = {
        ...additionalUserInfo,
        updatedAt: serverTimestamp(),
      };

      console.log('[loginWithGoogle] Dados a atualizar:', updateData);
      await updateDoc(userRef, updateData);
      console.log('[loginWithGoogle] updateDoc concluído');

      // Se o usuário tem o role solicitado, alterna para ele
      if (profile.roles.includes(role)) {
        if (profile.activeRole !== role) {
          console.log(`[loginWithGoogle] Alternando role de ${profile.activeRole} para ${role}`);
          await switchActiveRole(user.uid, role);
        }
      } else {
        console.log(`[loginWithGoogle] Usuário não possui role ${role}, mantendo ${profile.activeRole}`);
      }

      console.log('[loginWithGoogle] Buscando perfil atualizado...');
      profile = await getUserProfile(user.uid);
      console.log('[loginWithGoogle] Perfil atualizado:', profile);
    }

    if (!profile) {
      throw new Error('Erro ao obter perfil do usuário');
    }

    return profile;
  } catch (error: any) {
    console.error('[loginWithGoogle] Erro:', error.message || error);

    // Tratamento especial para conta existente com credencial diferente
    if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error('Esta conta já existe com um método de login diferente. Use o método original ou entre em contato com o suporte.');
    }

    // Se já é um Error com mensagem, manter a mensagem original
    if (error instanceof Error && error.message) {
      throw error;
    }

    throw new Error(getAuthErrorMessage(error.code) || error.message || 'Erro ao autenticar com Google');
  }
}

/**
 * Login com Facebook
 * Implementa vinculação automática de credenciais para evitar contas duplicadas
 */
export async function loginWithFacebook(role: UserRole = 'client'): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    const user = result.user;

    console.log('📝 [loginWithFacebook] Usuário autenticado:', user.uid);
    console.log('📊 [loginWithFacebook] Informações do Facebook:', {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      phoneNumber: user.phoneNumber,
      emailVerified: user.emailVerified,
      metadata: user.metadata,
      providerData: user.providerData,
    });

    // Extrair informações adicionais do Facebook (se disponível)
    const additionalUserInfo: any = {};

    // IMPORTANTE: A foto vem direto do user.photoURL (Firebase já processa)
    if (user.photoURL) {
      additionalUserInfo.photoURL = user.photoURL;
    }

    // O Facebook pode retornar informações adicionais no resultado
    if ((result as any).additionalUserInfo?.profile) {
      const facebookProfile = (result as any).additionalUserInfo.profile;
      console.log('📊 [loginWithFacebook] Perfil completo do Facebook:', facebookProfile);

      // Capturar informações extras do Facebook
      if (facebookProfile.first_name) additionalUserInfo.firstName = facebookProfile.first_name;
      if (facebookProfile.last_name) additionalUserInfo.lastName = facebookProfile.last_name;
      if (facebookProfile.gender) additionalUserInfo.gender = facebookProfile.gender;
      if (facebookProfile.birthday) additionalUserInfo.birthDate = facebookProfile.birthday;
      // Foto de alta qualidade do Facebook (sobrescreve se disponível)
      if (facebookProfile.picture?.data?.url) additionalUserInfo.photoURL = facebookProfile.picture.data.url;
      if (facebookProfile.locale) additionalUserInfo.locale = facebookProfile.locale;
    }

    console.log('📊 [loginWithFacebook] Informações adicionais capturadas:', additionalUserInfo);

    let profile = await getUserProfile(user.uid);

    // REGRA DE NEGÓCIO:
    // - Se é a PRIMEIRA VEZ do usuário (não tem perfil), cria com o role selecionado
    // - Se JÁ TEM perfil, permite login em QUALQUER role (não restringe)
    //   e oferece opção de adicionar novo role depois
    if (!profile) {
      // Primeira vez - cria o perfil com o role selecionado
      console.log('📝 [loginWithFacebook] Primeiro acesso. Criando perfil com role:', role);
      await createUserProfile(user, role, additionalUserInfo);
      profile = await getUserProfile(user.uid);
    } else {
      // Já tem perfil - permite login e atualiza informações
      console.log('📝 [loginWithFacebook] Usuário já possui perfil. Atualizando informações...');

      // Atualiza informações adicionais (incluindo foto)
      const userRef = doc(db, 'users', user.uid);
      const updateData: any = {
        ...additionalUserInfo,
        updatedAt: serverTimestamp(),
      };

      console.log('📝 [loginWithFacebook] Dados a atualizar:', updateData);
      await updateDoc(userRef, updateData);

      // Se o usuário tem o role solicitado, alterna para ele
      if (profile.roles.includes(role)) {
        if (profile.activeRole !== role) {
          await switchActiveRole(user.uid, role);
        }
      } else {
        // Se não tem o role, mantém o role atual
        console.log(`⚠️ [loginWithFacebook] Usuário não possui o role ${role}. Mantendo role atual: ${profile.activeRole}`);
      }

      profile = await getUserProfile(user.uid);
    }

    if (!profile) throw new Error('Erro ao obter perfil do usuário');

    return profile;
  } catch (error: any) {
    console.error('❌ [loginWithFacebook] Erro:', error);

    // Tratamento especial para conta existente com credencial diferente
    if (error.code === 'auth/account-exists-with-different-credential') {
      console.log('📝 [loginWithFacebook] Conta existe com credencial diferente. Tentando vincular...');

      // O Firebase já vinculou automaticamente na maioria dos casos modernos
      // Se chegou aqui, é um caso raro que precisa ser tratado manualmente
      throw new Error('Esta conta já existe com um método de login diferente. Use o método original ou entre em contato com o suporte.');
    }

    throw new Error(getAuthErrorMessage(error.code) || error.message);
  }
}

/**
 * Faz logout
 */
export async function logout(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Envia email de recuperação de senha
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Atualiza a foto de perfil do usuário
 */
export async function updateUserProfilePhoto(uid: string, photoURL: string): Promise<void> {
  console.log('📝 [updateUserProfilePhoto] Atualizando foto de perfil');

  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    photoURL,
    updatedAt: serverTimestamp()
  });

  // Atualizar também no Firebase Auth se o usuário estiver logado
  if (auth.currentUser && auth.currentUser.uid === uid) {
    await updateProfile(auth.currentUser, { photoURL });
  }

  console.log('✅ [updateUserProfilePhoto] Foto de perfil atualizada!');
}

/**
 * Atualiza a foto de capa do usuário
 */
export async function updateUserCoverPhoto(uid: string, coverPhotoURL: string): Promise<void> {
  console.log('📝 [updateUserCoverPhoto] Atualizando foto de capa');

  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    coverPhotoURL,
    updatedAt: serverTimestamp()
  });

  console.log('✅ [updateUserCoverPhoto] Foto de capa atualizada!');
}

/**
 * Atualiza dados do perfil do usuário (nome, telefone, etc)
 */
export async function updateUserProfile(uid: string, data: {
  displayName?: string;
  phone?: string;
}): Promise<void> {
  console.log('📝 [updateUserProfile] Atualizando perfil do usuário');

  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp()
  });

  // Atualizar displayName no Firebase Auth se fornecido
  if (data.displayName && auth.currentUser && auth.currentUser.uid === uid) {
    await updateProfile(auth.currentUser, { displayName: data.displayName });
  }

  console.log('✅ [updateUserProfile] Perfil atualizado com sucesso!');
}

/**
 * Verifica se um email já possui conta e retorna os dados do usuário
 */
export async function checkEmailExists(email: string): Promise<{ exists: boolean; userData?: UserProfile }> {
  try {
    // Tenta fazer uma query no Firestore para ver se existe um usuário com esse email
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data() as UserProfile;
      return { exists: true, userData };
    }

    return { exists: false };
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    return { exists: false };
  }
}

/**
 * Valida a senha do usuário e adiciona um novo role
 */
export async function addRoleWithPassword(
  email: string,
  password: string,
  newRole: UserRole,
  cnpj?: string
): Promise<UserProfile> {
  try {
    // Primeiro valida a senha fazendo login
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Adiciona o novo role
    await addRoleToUser(user.uid, newRole, cnpj);

    // Retorna o perfil atualizado
    const profile = await getUserProfile(user.uid);
    if (!profile) throw new Error('Erro ao obter perfil atualizado');

    return profile;
  } catch (error: any) {
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      throw new Error('Senha incorreta');
    }
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Observador de mudanças no estado de autenticação
 */
export function onAuthStateChange(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Traduz erros do Firebase para português
 */
function getAuthErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'Este email já está em uso',
    'auth/invalid-email': 'Email inválido',
    'auth/operation-not-allowed': 'Operação não permitida',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres',
    'auth/user-disabled': 'Esta conta foi desabilitada',
    'auth/user-not-found': 'Usuário não encontrado',
    'auth/wrong-password': 'Senha incorreta',
    'auth/invalid-credential': 'Email ou senha incorretos',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
    'auth/network-request-failed': 'Erro de conexão. Verifique sua internet',
    'auth/popup-closed-by-user': 'Login cancelado pelo usuário',
    'auth/cancelled-popup-request': 'Apenas uma janela de login pode ser aberta por vez',
  };

  return errorMessages[errorCode] || 'Erro ao autenticar. Tente novamente';
}
