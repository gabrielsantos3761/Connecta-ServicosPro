import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface BusinessAddress {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  latitude?: number
  longitude?: number
}

export interface BusinessHours {
  day: string // 'monday', 'tuesday', etc.
  open: string // '09:00'
  close: string // '18:00'
  isOpen: boolean
}

export interface Business {
  id: string
  ownerId: string
  name: string
  cnpj: string
  description: string
  category: string
  image?: string
  coverImage?: string
  gallery?: string[]
  address: BusinessAddress
  phone: string
  email?: string
  website?: string
  businessHours: BusinessHours[]
  rating: number
  totalReviews: number
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface CreateBusinessData {
  name: string
  cnpj: string
  description: string
  category: string
  address: BusinessAddress
  phone: string
  email?: string
  website?: string
  businessHours: BusinessHours[]
}

/**
 * Cria um novo estabelecimento
 */
export async function createBusiness(
  ownerId: string,
  businessData: CreateBusinessData
): Promise<Business> {
  try {
    console.log('[businessService] Criando estabelecimento:', businessData.name)

    // Validar CNPJ (formato básico)
    const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/
    if (!cnpjRegex.test(businessData.cnpj)) {
      throw new Error('CNPJ inválido. Use o formato: 00.000.000/0000-00')
    }

    // Verificar se já existe um estabelecimento com este CNPJ
    const businessesRef = collection(db, 'businesses')
    const q = query(businessesRef, where('cnpj', '==', businessData.cnpj))
    const existingBusiness = await getDocs(q)

    if (!existingBusiness.empty) {
      throw new Error('Já existe um estabelecimento cadastrado com este CNPJ')
    }

    // Gerar ID único para o estabelecimento
    const businessId = doc(collection(db, 'businesses')).id

    // Criar objeto do estabelecimento
    const business: Business = {
      id: businessId,
      ownerId,
      ...businessData,
      rating: 0,
      totalReviews: 0,
      isActive: true,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    }

    // Salvar no Firestore
    await setDoc(doc(db, 'businesses', businessId), business)

    console.log('[businessService] Estabelecimento criado com sucesso:', businessId)
    return business
  } catch (error: any) {
    console.error('[businessService] Erro ao criar estabelecimento:', error)
    throw new Error(error.message || 'Erro ao criar estabelecimento')
  }
}

/**
 * Busca um estabelecimento por ID
 */
export async function getBusinessById(businessId: string): Promise<Business | null> {
  try {
    const businessDoc = await getDoc(doc(db, 'businesses', businessId))

    if (!businessDoc.exists()) {
      return null
    }

    return businessDoc.data() as Business
  } catch (error) {
    console.error('[businessService] Erro ao buscar estabelecimento:', error)
    throw error
  }
}

/**
 * Busca todos os estabelecimentos de um proprietário
 */
export async function getBusinessesByOwner(ownerId: string): Promise<Business[]> {
  try {
    const businessesRef = collection(db, 'businesses')
    const q = query(businessesRef, where('ownerId', '==', ownerId))
    const querySnapshot = await getDocs(q)

    const businesses: Business[] = []
    querySnapshot.forEach((doc) => {
      businesses.push(doc.data() as Business)
    })

    return businesses
  } catch (error) {
    console.error('[businessService] Erro ao buscar estabelecimentos:', error)
    throw error
  }
}

/**
 * Atualiza um estabelecimento
 */
export async function updateBusiness(
  businessId: string,
  updates: Partial<CreateBusinessData>
): Promise<void> {
  try {
    const businessRef = doc(db, 'businesses', businessId)

    await updateDoc(businessRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })

    console.log('[businessService] Estabelecimento atualizado:', businessId)
  } catch (error) {
    console.error('[businessService] Erro ao atualizar estabelecimento:', error)
    throw error
  }
}

/**
 * Desativa um estabelecimento (soft delete)
 */
export async function deactivateBusiness(businessId: string): Promise<void> {
  try {
    const businessRef = doc(db, 'businesses', businessId)

    await updateDoc(businessRef, {
      isActive: false,
      updatedAt: serverTimestamp(),
    })

    console.log('[businessService] Estabelecimento desativado:', businessId)
  } catch (error) {
    console.error('[businessService] Erro ao desativar estabelecimento:', error)
    throw error
  }
}

/**
 * Remove um estabelecimento permanentemente
 */
export async function deleteBusiness(businessId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'businesses', businessId))
    console.log('[businessService] Estabelecimento removido:', businessId)
  } catch (error) {
    console.error('[businessService] Erro ao remover estabelecimento:', error)
    throw error
  }
}

/**
 * Gera ou obtém o código de vinculação do estabelecimento
 */
export async function getOrCreateLinkCode(businessId: string): Promise<string> {
  const businessRef = doc(db, 'businesses', businessId)
  const businessSnap = await getDoc(businessRef)

  if (!businessSnap.exists()) {
    throw new Error('Estabelecimento não encontrado')
  }

  const data = businessSnap.data()

  // Se já tem um linkCode, retorna
  if (data.linkCode) {
    return data.linkCode
  }

  // Gera um código único de 8 caracteres
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  // Salva no documento do business
  await updateDoc(businessRef, {
    linkCode: code,
    updatedAt: serverTimestamp(),
  })

  return code
}

/**
 * Valida e formata CNPJ
 */
export function formatCNPJ(cnpj: string): string {
  // Remove caracteres não numéricos
  const numbers = cnpj.replace(/\D/g, '')

  // Aplica a máscara
  return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

/**
 * Valida CNPJ
 */
export function validateCNPJ(cnpj: string): boolean {
  const numbers = cnpj.replace(/\D/g, '')

  if (numbers.length !== 14) {
    return false
  }

  // Validação básica - verifica se não é uma sequência repetida
  if (/^(\d)\1+$/.test(numbers)) {
    return false
  }

  return true
}

/**
 * Busca estabelecimentos por categoria
 */
export async function getBusinessesByCategory(category: string): Promise<Business[]> {
  try {
    const businessesRef = collection(db, 'businesses')
    const q = query(
      businessesRef,
      where('category', '==', category),
      where('isActive', '==', true)
    )
    const querySnapshot = await getDocs(q)

    const businesses: Business[] = []
    querySnapshot.forEach((doc) => {
      businesses.push(doc.data() as Business)
    })

    return businesses
  } catch (error) {
    console.error('[businessService] Erro ao buscar estabelecimentos por categoria:', error)
    throw error
  }
}

/**
 * Busca todos os estabelecimentos ativos
 */
export async function getAllActiveBusinesses(): Promise<Business[]> {
  try {
    console.log('[businessService] Buscando todos os estabelecimentos ativos...')
    const businessesRef = collection(db, 'businesses')
    const q = query(businessesRef, where('isActive', '==', true))
    const querySnapshot = await getDocs(q)

    const businesses: Business[] = []
    querySnapshot.forEach((doc) => {
      businesses.push(doc.data() as Business)
    })

    console.log(`[businessService] ${businesses.length} estabelecimentos encontrados`)
    return businesses
  } catch (error) {
    console.error('[businessService] Erro ao buscar estabelecimentos:', error)
    throw error
  }
}

/**
 * Busca estatísticas gerais dos estabelecimentos
 */
export async function getBusinessStats(): Promise<{
  totalBusinesses: number
  averageRating: number
  totalReviews: number
}> {
  try {
    const businesses = await getAllActiveBusinesses()

    const totalBusinesses = businesses.length
    const totalReviews = businesses.reduce((sum, b) => sum + b.totalReviews, 0)
    const averageRating = businesses.length > 0
      ? businesses.reduce((sum, b) => sum + b.rating, 0) / businesses.length
      : 0

    return {
      totalBusinesses,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews
    }
  } catch (error) {
    console.error('[businessService] Erro ao buscar estatísticas:', error)
    return {
      totalBusinesses: 0,
      averageRating: 0,
      totalReviews: 0
    }
  }
}
