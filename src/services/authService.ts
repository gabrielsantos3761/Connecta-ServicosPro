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
  // Campos de completude do perfil
  profileComplete?: boolean; // Se o perfil está completo
  missingFields?: string[]; // Lista de campos faltantes
  profileCompleteness?: number; // Porcentagem de completude (0-100)
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
 * Usa Cloud Function que valida o usuário sem precisar de token do cliente
 */
async function createUserProfile(
  user: FirebaseUser,
  role: UserRole,
  additionalData?: any
): Promise<void> {
  try {
    console.log('[createUserProfile] Criando perfil via Cloud Function...');
    const displayName = user.displayName || user.email!.split('@')[0];
    const photoURL = additionalData?.photoURL || user.photoURL || undefined;

    // Usar Cloud Function simplificada que não precisa de token
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const functions = getFunctions(undefined, 'southamerica-east1');
    const createInitialUser = httpsCallable(functions, 'createInitialUserDocument');

    console.log('[createUserProfile] Chamando Cloud Function com dados:', {
      uid: user.uid,
      email: user.email,
      displayName,
      role,
      additionalData
    });

    const result = await createInitialUser({
      uid: user.uid,
      email: user.email!,
      displayName,
      role,
      photoURL,
      // Passar todos os campos do additionalData
      ...(additionalData || {})
    });

    console.log('[createUserProfile] Cloud Function retornou:', result.data);

    if (!(result.data as any).success) {
      throw new Error((result.data as any).message || 'Erro ao criar documento do usuário');
    }

    console.log('[createUserProfile] Perfil criado com sucesso!');
  } catch (error: any) {
    console.error('[createUserProfile] Erro ao criar documento:', error);
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
 * @param uid - ID do usuário
 * @param options - Opções de retry para lidar com race conditions durante registro
 */
export async function getUserProfile(
  uid: string,
  options?: {
    retries?: number;
    initialDelay?: number;
    maxDelay?: number;
  }
): Promise<UserProfile | null> {
  const { retries = 0, initialDelay = 1000, maxDelay = 5000 } = options || {};

  console.log('[getUserProfile] Buscando perfil para UID:', uid);
  console.log('[getUserProfile] auth.currentUser:', auth.currentUser ? auth.currentUser.uid : 'NULL');

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        console.log('[getUserProfile] Perfil encontrado', attempt > 0 ? `(após ${attempt} tentativas)` : '');
        return userSnap.data() as UserProfile;
      }

      // Se não existe e ainda temos retries, aguarda antes de tentar novamente
      if (attempt < retries) {
        const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
        console.log(`[getUserProfile] Perfil não encontrado, tentando novamente em ${delay}ms (tentativa ${attempt + 1}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      lastError = error;
      console.error(`[getUserProfile] Erro na tentativa ${attempt + 1}:`, error);

      // Se ainda temos retries, aguarda antes de tentar novamente
      if (attempt < retries) {
        const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
        console.log(`[getUserProfile] Aguardando ${delay}ms antes de tentar novamente...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  if (lastError) {
    console.error('[getUserProfile] Falhou após todas as tentativas:', lastError);
    throw lastError;
  }

  console.log('[getUserProfile] Perfil não encontrado após todas as tentativas');
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
 * Com retry automático para erros de permissão (propagação de regras)
 */
export async function loginWithGoogle(role: UserRole = 'client'): Promise<UserProfile> {
  const MAX_RETRIES = 2;
  let lastError: any = null;
  let cachedUser: any = null;
  let cachedAdditionalInfo: any = {};

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[loginWithGoogle] Tentativa ${attempt} de ${MAX_RETRIES}`);

      // Na primeira tentativa, faz o signInWithPopup e guarda o user
      // Nas tentativas seguintes, reutiliza o user da primeira tentativa
      let user: any;
      let additionalUserInfo: any = {};

      if (attempt === 1) {
        const result = await signInWithPopup(auth, googleProvider);
        user = result.user;

        // Guarda o user para tentativas futuras
        cachedUser = user;

        // IMPORTANTE: Aguardar a sincronização do estado de autenticação
        console.log('[loginWithGoogle] Aguardando sincronização do Firebase Auth...');
        await new Promise<void>((resolve) => {
          const timeoutId = setTimeout(() => {
            console.warn('[loginWithGoogle] Timeout ao aguardar sincronização, continuando mesmo assim');
            unsubscribe();
            resolve();
          }, 5000);

          const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser && currentUser.uid === user.uid) {
              console.log('[loginWithGoogle] Firebase Auth sincronizado!');
              clearTimeout(timeoutId);
              unsubscribe();
              resolve();
            }
          });
        });

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

        // Guarda as informações adicionais
        cachedAdditionalInfo = additionalUserInfo;
      } else {
        // Nas tentativas seguintes, reutiliza o user da primeira tentativa
        console.log('[loginWithGoogle] Usando usuário da primeira tentativa para retry');
        user = cachedUser;
        additionalUserInfo = cachedAdditionalInfo;

        if (!user) {
          throw new Error('Usuário não disponível para retry');
        }
      }

      console.log(`[loginWithGoogle] Tentando buscar perfil do usuário ${user.uid}...`);
      let profile = await getUserProfile(user.uid);
      console.log(`[loginWithGoogle] getUserProfile retornou:`, profile ? 'PERFIL EXISTE' : 'PERFIL NÃO EXISTE');

      // REGRA DE NEGÓCIO:
      // - Se é a PRIMEIRA VEZ do usuário (não tem perfil), cria com o role selecionado
      // - Se JÁ TEM perfil, permite login em QUALQUER role (não restringe)
      //   e oferece opção de adicionar novo role depois
      if (!profile) {
        // Primeira vez - cria o perfil com o role selecionado
        console.log('[loginWithGoogle] Criando perfil pela primeira vez...');
        await createUserProfile(user, role, additionalUserInfo);
        console.log('[loginWithGoogle] Perfil criado com sucesso!');

        // Em vez de tentar ler o perfil recém-criado (que falha por propagação de regras),
        // construímos o objeto profile com os dados que já conhecemos
        console.log('[loginWithGoogle] Construindo profile a partir dos dados conhecidos...');
        profile = {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || user.email!.split('@')[0],
          photoURL: additionalUserInfo.photoURL || user.photoURL || undefined,
          roles: [role],
          activeRole: role,
          createdAt: new Date(),
          updatedAt: new Date(),
          // Novos usuários de login social não têm perfil completo
          profileComplete: false,
          missingFields: ['phone', 'cpf', 'gender', 'birthDate'],
          profileCompleteness: 25, // Tem apenas nome e email (2 de 6 campos = ~33%, mas arredondamos para 25)
        } as any;
        console.log('[loginWithGoogle] Profile construído:', profile);
      } else {
        // Já tem perfil - permite login e atualiza informações
        console.log('[loginWithGoogle] Usuário já possui perfil, atualizando informações...');
        const userRef = doc(db, 'users', user.uid);
        const updateData: any = {
          ...additionalUserInfo,
          updatedAt: serverTimestamp(),
        };

        console.log('[loginWithGoogle] Dados a atualizar:', updateData);
        console.log('[loginWithGoogle] Executando updateDoc...');
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

      console.log(`[loginWithGoogle] Login bem-sucedido na tentativa ${attempt}`);
      return profile;
    } catch (error: any) {
      console.error(`[loginWithGoogle] Erro na tentativa ${attempt}:`, error.message || error);
      lastError = error;

      // Tratamento especial para conta existente com credencial diferente
      if (error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('Esta conta já existe com um método de login diferente. Use o método original ou entre em contato com o suporte.');
      }

      // Se for erro de permissão e ainda há tentativas, aguarda e tenta novamente
      if (error.message?.includes('Missing or insufficient permissions') && attempt < MAX_RETRIES) {
        console.log(`[loginWithGoogle] Erro de permissão detectado. Tentando novamente em 2.5 segundos...`);
        await new Promise(resolve => setTimeout(resolve, 2500));
        continue;
      }

      // Se é a última tentativa ou erro diferente, propaga o erro
      if (error instanceof Error && error.message) {
        throw error;
      }

      throw new Error(getAuthErrorMessage(error.code) || error.message || 'Erro ao autenticar com Google');
    }
  }

  // Não deve chegar aqui, mas por segurança
  throw lastError || new Error('Erro ao autenticar com Google após múltiplas tentativas');
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
    const { collection, query, where, limit, getDocs } = await import('firebase/firestore');
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email), limit(1));
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
