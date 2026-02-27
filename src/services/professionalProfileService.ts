import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

// ============================================
// TIPOS
// ============================================

export interface InfoPessoaisData {
  name?: string
  phone?: string
  pix?: string
  avatarUrl?: string
  updatedAt?: any
}

export interface EnderecoData {
  cep?: string
  endereco?: string
  numero?: string
  complemento?: string
  updatedAt?: any
}

export interface EspecialidadesData {
  items?: string[]
  updatedAt?: any
}

// ============================================
// HELPERS - Caminhos dos documentos de aba
// ============================================

// professionals/{uid}/ConfiguracaoPerfil/{tabName}

function getTabDocRef(uid: string, tabName: string) {
  return doc(db, 'professionals', uid, 'ConfiguracaoPerfil', tabName)
}

// ============================================
// INFORMAÇÕES PESSOAIS
// ============================================

export async function getProfissionalInfoPessoais(uid: string): Promise<InfoPessoaisData | null> {
  try {
    const docRef = getTabDocRef(uid, 'InformacoesPessoais')
    const snap = await getDoc(docRef)
    if (snap.exists()) {
      return snap.data() as InfoPessoaisData
    }
    return null
  } catch (error) {
    console.error('[professionalProfile] Erro ao buscar informações pessoais:', error)
    throw error
  }
}

export async function saveProfissionalInfoPessoais(
  uid: string,
  data: Omit<InfoPessoaisData, 'updatedAt'>
): Promise<void> {
  try {
    const docRef = getTabDocRef(uid, 'InformacoesPessoais')
    await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true })
  } catch (error) {
    console.error('[professionalProfile] Erro ao salvar informações pessoais:', error)
    throw error
  }
}

// ============================================
// ENDEREÇO
// ============================================

export async function getProfissionalEndereco(uid: string): Promise<EnderecoData | null> {
  try {
    const docRef = getTabDocRef(uid, 'Endereco')
    const snap = await getDoc(docRef)
    if (snap.exists()) {
      return snap.data() as EnderecoData
    }
    return null
  } catch (error) {
    console.error('[professionalProfile] Erro ao buscar endereço:', error)
    throw error
  }
}

export async function saveProfissionalEndereco(
  uid: string,
  data: Omit<EnderecoData, 'updatedAt'>
): Promise<void> {
  try {
    const docRef = getTabDocRef(uid, 'Endereco')
    await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true })
  } catch (error) {
    console.error('[professionalProfile] Erro ao salvar endereço:', error)
    throw error
  }
}

// ============================================
// ESPECIALIDADES
// ============================================

export async function getProfissionalEspecialidades(uid: string): Promise<EspecialidadesData | null> {
  try {
    const docRef = getTabDocRef(uid, 'Especialidades')
    const snap = await getDoc(docRef)
    if (snap.exists()) {
      return snap.data() as EspecialidadesData
    }
    return null
  } catch (error) {
    console.error('[professionalProfile] Erro ao buscar especialidades:', error)
    throw error
  }
}

export async function saveProfissionalEspecialidades(
  uid: string,
  data: Omit<EspecialidadesData, 'updatedAt'>
): Promise<void> {
  try {
    const docRef = getTabDocRef(uid, 'Especialidades')
    await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true })
  } catch (error) {
    console.error('[professionalProfile] Erro ao salvar especialidades:', error)
    throw error
  }
}
