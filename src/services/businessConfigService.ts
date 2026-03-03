/**
 * Service para gerenciar as configurações do estabelecimento
 * Segue o padrão de subcoleções por aba:
 * /businesses/{id}/Configuracoes/{tabName}
 *
 * Dual-write: salva nas subcoleções E sincroniza o documento principal
 * para que as queries de lista (EmpresasPorCategoria, etc.) continuem funcionando.
 */
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { type Business, type BusinessHours, type BusinessAddress } from '@/services/businessService'

// ============================================
// INTERFACES DAS ABAS
// ============================================

export interface ConfigInformacoes {
  name?: string
  cnpj?: string
  description?: string
  category?: string
  updatedAt?: any
}

export interface ConfigFotos {
  image?: string
  coverImage?: string
  gallery?: string[]
  updatedAt?: any
}

export interface ConfigContato {
  phone?: string
  email?: string
  website?: string
  updatedAt?: any
}

export interface ConfigEndereco {
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  zipCode?: string
  latitude?: number
  longitude?: number
  updatedAt?: any
}

export interface ConfigHorarios {
  businessHours?: BusinessHours[]
  updatedAt?: any
}

export interface AllBusinessConfigs {
  informacoes: ConfigInformacoes
  fotos: ConfigFotos
  contato: ConfigContato
  endereco: ConfigEndereco
  horarios: ConfigHorarios
}

// ============================================
// HELPER — referência de documento da aba
// ============================================

function getTabRef(businessId: string, tabName: string) {
  return doc(db, 'businesses', businessId, 'Configuracoes', tabName)
}

// ============================================
// LEITURA POR ABA (com fallback ao doc principal)
// ============================================

export async function getConfigInformacoes(businessId: string): Promise<ConfigInformacoes | null> {
  try {
    const snap = await getDoc(getTabRef(businessId, 'Informacoes'))
    if (snap.exists()) return snap.data() as ConfigInformacoes

    // Fallback: lê do documento principal (para estabelecimentos ainda não migrados)
    const mainSnap = await getDoc(doc(db, 'businesses', businessId))
    if (!mainSnap.exists()) return null
    const d = mainSnap.data() as Business
    return { name: d.name, cnpj: d.cnpj, description: d.description, category: d.category }
  } catch (error) {
    console.error('[businessConfig] Erro ao buscar Informacoes:', error)
    return null
  }
}

export async function getConfigFotos(businessId: string): Promise<ConfigFotos | null> {
  try {
    const snap = await getDoc(getTabRef(businessId, 'Fotos'))
    if (snap.exists()) return snap.data() as ConfigFotos

    const mainSnap = await getDoc(doc(db, 'businesses', businessId))
    if (!mainSnap.exists()) return null
    const d = mainSnap.data() as Business
    return { image: d.image, coverImage: d.coverImage, gallery: d.gallery ?? [] }
  } catch (error) {
    console.error('[businessConfig] Erro ao buscar Fotos:', error)
    return null
  }
}

export async function getConfigContato(businessId: string): Promise<ConfigContato | null> {
  try {
    const snap = await getDoc(getTabRef(businessId, 'Contato'))
    if (snap.exists()) return snap.data() as ConfigContato

    const mainSnap = await getDoc(doc(db, 'businesses', businessId))
    if (!mainSnap.exists()) return null
    const d = mainSnap.data() as Business
    return { phone: d.phone, email: d.email, website: d.website }
  } catch (error) {
    console.error('[businessConfig] Erro ao buscar Contato:', error)
    return null
  }
}

export async function getConfigEndereco(businessId: string): Promise<ConfigEndereco | null> {
  try {
    const snap = await getDoc(getTabRef(businessId, 'Endereco'))
    if (snap.exists()) return snap.data() as ConfigEndereco

    const mainSnap = await getDoc(doc(db, 'businesses', businessId))
    if (!mainSnap.exists()) return null
    const d = mainSnap.data() as Business
    return { ...d.address }
  } catch (error) {
    console.error('[businessConfig] Erro ao buscar Endereco:', error)
    return null
  }
}

export async function getConfigHorarios(businessId: string): Promise<ConfigHorarios | null> {
  try {
    const snap = await getDoc(getTabRef(businessId, 'Horarios'))
    if (snap.exists()) return snap.data() as ConfigHorarios

    const mainSnap = await getDoc(doc(db, 'businesses', businessId))
    if (!mainSnap.exists()) return null
    const d = mainSnap.data() as Business
    return { businessHours: d.businessHours }
  } catch (error) {
    console.error('[businessConfig] Erro ao buscar Horarios:', error)
    return null
  }
}

/** Lê todas as abas em paralelo — uso na tela de configurações e em EmpresaDetalhes */
export async function getAllBusinessConfigs(businessId: string): Promise<AllBusinessConfigs> {
  const [informacoes, fotos, contato, endereco, horarios] = await Promise.all([
    getConfigInformacoes(businessId),
    getConfigFotos(businessId),
    getConfigContato(businessId),
    getConfigEndereco(businessId),
    getConfigHorarios(businessId),
  ])

  return {
    informacoes: informacoes ?? {},
    fotos: fotos ?? {},
    contato: contato ?? {},
    endereco: endereco ?? {},
    horarios: horarios ?? {},
  }
}

// ============================================
// ESCRITA POR ABA (subcoleção + sync main doc)
// ============================================

export async function saveConfigInformacoes(
  businessId: string,
  data: Omit<ConfigInformacoes, 'updatedAt'>
): Promise<void> {
  const payload = { ...data, updatedAt: serverTimestamp() }
  await setDoc(getTabRef(businessId, 'Informacoes'), payload, { merge: true })

  // Sync main doc — campos usados nas queries de lista
  await updateDoc(doc(db, 'businesses', businessId), {
    name: data.name,
    description: data.description,
    category: data.category,
    updatedAt: serverTimestamp(),
  })
}

export async function saveConfigFotos(
  businessId: string,
  data: Omit<ConfigFotos, 'updatedAt'>
): Promise<void> {
  const payload = { ...data, updatedAt: serverTimestamp() }
  await setDoc(getTabRef(businessId, 'Fotos'), payload, { merge: true })

  // Sync main doc
  await updateDoc(doc(db, 'businesses', businessId), {
    ...(data.image !== undefined && { image: data.image }),
    ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
    ...(data.gallery !== undefined && { gallery: data.gallery }),
    updatedAt: serverTimestamp(),
  })
}

export async function saveConfigContato(
  businessId: string,
  data: Omit<ConfigContato, 'updatedAt'>
): Promise<void> {
  const payload = { ...data, updatedAt: serverTimestamp() }
  await setDoc(getTabRef(businessId, 'Contato'), payload, { merge: true })

  // Sync main doc
  await updateDoc(doc(db, 'businesses', businessId), {
    phone: data.phone,
    ...(data.email !== undefined && { email: data.email }),
    ...(data.website !== undefined && { website: data.website }),
    updatedAt: serverTimestamp(),
  })
}

export async function saveConfigEndereco(
  businessId: string,
  data: Omit<ConfigEndereco, 'updatedAt'>
): Promise<void> {
  const payload = { ...data, updatedAt: serverTimestamp() }
  await setDoc(getTabRef(businessId, 'Endereco'), payload, { merge: true })

  // Sync main doc — address é um objeto embutido no doc principal
  const address: BusinessAddress = {
    street: data.street ?? '',
    number: data.number ?? '',
    complement: data.complement,
    neighborhood: data.neighborhood ?? '',
    city: data.city ?? '',
    state: data.state ?? '',
    zipCode: data.zipCode ?? '',
    ...(data.latitude !== undefined && { latitude: data.latitude }),
    ...(data.longitude !== undefined && { longitude: data.longitude }),
  }
  await updateDoc(doc(db, 'businesses', businessId), {
    address,
    updatedAt: serverTimestamp(),
  })
}

export async function saveConfigHorarios(
  businessId: string,
  data: Omit<ConfigHorarios, 'updatedAt'>
): Promise<void> {
  const payload = { ...data, updatedAt: serverTimestamp() }
  await setDoc(getTabRef(businessId, 'Horarios'), payload, { merge: true })

  // Sync main doc
  await updateDoc(doc(db, 'businesses', businessId), {
    businessHours: data.businessHours,
    updatedAt: serverTimestamp(),
  })
}
