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

export type UserRole = 'client' | 'professional' | 'owner';

// Interface principal do usuário (coleção users)
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  roles: UserRole[]; // Array de roles que o usuário possui
  activeRole: UserRole; // Role ativo no momento
  photoURL?: string;
  phone?: string;
  cpf?: string;
  gender?: string;
  birthDate?: string;
  createdAt: any;
  updatedAt: any;
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
const facebookProvider = new FacebookAuthProvider();

/**
 * Cria um perfil de usuário no Firestore (coleção users)
 */
async function createUserProfile(
  user: FirebaseUser,
  role: UserRole,
  additionalData?: any
): Promise<void> {
  console.log('📝 [createUserProfile] Criando documento no Firestore para UID:', user.uid);
  const userRef = doc(db, 'users', user.uid);

  const userProfile: any = {
    uid: user.uid,
    email: user.email!,
    displayName: user.displayName || user.email!.split('@')[0],
    roles: [role], // Inicia com apenas 1 role
    activeRole: role, // Role ativo é o inicial
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...additionalData
  };

  // Apenas adiciona photoURL se existir
  if (user.photoURL) {
    userProfile.photoURL = user.photoURL;
  }

  console.log('📝 [createUserProfile] Dados do perfil:', userProfile);

  try {
    await setDoc(userRef, userProfile, { merge: true });
    console.log('✅ [createUserProfile] Documento criado com sucesso!');
  } catch (error) {
    console.error('❌ [createUserProfile] Erro ao criar documento:', error);
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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    let profile = await getUserProfile(user.uid);

    // Se o perfil não existir, cria um (caso de usuário criado externamente)
    if (!profile) {
      await createUserProfile(user, expectedRole || 'client');
      profile = await getUserProfile(user.uid);
    }

    if (!profile) throw new Error('Erro ao obter perfil do usuário');

    // Verifica se o usuário possui o role esperado
    if (expectedRole && !profile.roles.includes(expectedRole)) {
      await signOut(auth);
      throw new Error(`Você não tem permissão para acessar como ${expectedRole}`);
    }

    // Se o usuário possui o role, mas não está ativo, alterna
    if (expectedRole && profile.activeRole !== expectedRole) {
      await switchActiveRole(user.uid, expectedRole);
      profile = await getUserProfile(user.uid);
    }

    return profile!;
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Login com Google
 */
export async function loginWithGoogle(role: UserRole = 'client'): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    let profile = await getUserProfile(user.uid);

    // Se é a primeira vez do usuário, cria o perfil
    if (!profile) {
      await createUserProfile(user, role);
      profile = await getUserProfile(user.uid);
    }

    if (!profile) throw new Error('Erro ao obter perfil do usuário');

    return profile;
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Login com Facebook
 */
export async function loginWithFacebook(role: UserRole = 'client'): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    const user = result.user;

    let profile = await getUserProfile(user.uid);

    // Se é a primeira vez do usuário, cria o perfil
    if (!profile) {
      await createUserProfile(user, role);
      profile = await getUserProfile(user.uid);
    }

    if (!profile) throw new Error('Erro ao obter perfil do usuário');

    return profile;
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
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
