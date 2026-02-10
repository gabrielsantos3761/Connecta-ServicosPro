import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

// ============================================
// TIPOS
// ============================================

export interface ServicoData {
  id: string
  name: string
  description: string
  category: string
  price: number
  duration: number // em minutos
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface CategoriaData {
  id: string
  name: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ComboData {
  id: string
  name: string
  serviceIds: string[]
  serviceNames: string[]
  originalPrice: number
  comboPrice: number
  duration: number // em minutos (soma das durações dos serviços)
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface CupomData {
  id: string
  code: string
  discount: number
  usedCount: number
  usageLimit: number
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface PromocaoData {
  id: string
  serviceName: string
  serviceId?: string
  discount: number
  originalPrice: number
  isActive: boolean
  validUntil: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================
// HELPERS - Caminhos das subcoleções
// ============================================

// businesses/{businessId}/Gerenciar Servicos/{tabName}/items/{itemId}

function getItemsCollectionPath(businessId: string, tabName: string) {
  return collection(db, 'businesses', businessId, 'GerenciarServicos', tabName, 'items')
}

function getItemDocPath(businessId: string, tabName: string, itemId: string) {
  return doc(db, 'businesses', businessId, 'GerenciarServicos', tabName, 'items', itemId)
}

// Garante que o documento pai da aba exista (necessário para subcoleções)
async function ensureTabDocument(businessId: string, tabName: string) {
  const tabDocRef = doc(db, 'businesses', businessId, 'GerenciarServicos', tabName)
  const tabDoc = await getDoc(tabDocRef)
  if (!tabDoc.exists()) {
    await setDoc(tabDocRef, { createdAt: serverTimestamp() })
  }
}

// ============================================
// SERVIÇOS (aba Serviços)
// ============================================

export async function getServicos(businessId: string): Promise<ServicoData[]> {
  try {
    const itemsRef = getItemsCollectionPath(businessId, 'Servicos')
    const snapshot = await getDocs(itemsRef)
    const items: ServicoData[] = []
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as ServicoData)
    })
    return items
  } catch (error) {
    console.error('[gerenciarServicos] Erro ao buscar serviços:', error)
    throw error
  }
}

export async function addServico(businessId: string, data: Omit<ServicoData, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServicoData> {
  try {
    await ensureTabDocument(businessId, 'Servicos')
    const itemsRef = getItemsCollectionPath(businessId, 'Servicos')
    const newDocRef = doc(itemsRef)
    const servico: ServicoData = {
      id: newDocRef.id,
      ...data,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    }
    await setDoc(newDocRef, servico)
    return servico
  } catch (error) {
    console.error('[gerenciarServicos] Erro ao adicionar serviço:', error)
    throw error
  }
}

export async function updateServico(businessId: string, servicoId: string, data: Partial<Omit<ServicoData, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  try {
    const docRef = getItemDocPath(businessId, 'Servicos', servicoId)
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() })
  } catch (error) {
    console.error('[gerenciarServicos] Erro ao atualizar serviço:', error)
    throw error
  }
}

export async function deleteServicos(businessId: string, ids: string[]): Promise<void> {
  try {
    const batch = writeBatch(db)
    ids.forEach((id) => {
      batch.delete(getItemDocPath(businessId, 'Servicos', id))
    })
    await batch.commit()
  } catch (error) {
    console.error('[gerenciarServicos] Erro ao deletar serviços:', error)
    throw error
  }
}

// ============================================
// CATEGORIAS (aba Categorias)
// ============================================

export async function getCategorias(businessId: string): Promise<CategoriaData[]> {
  try {
    const itemsRef = getItemsCollectionPath(businessId, 'Categorias')
    const snapshot = await getDocs(itemsRef)
    const items: CategoriaData[] = []
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as CategoriaData)
    })
    return items
  } catch (error) {
    console.error('[gerenciarServicos] Erro ao buscar categorias:', error)
    throw error
  }
}

export async function addCategoria(businessId: string, data: Omit<CategoriaData, 'id' | 'createdAt' | 'updatedAt'>): Promise<CategoriaData> {
  try {
    await ensureTabDocument(businessId, 'Categorias')
    const itemsRef = getItemsCollectionPath(businessId, 'Categorias')
    const newDocRef = doc(itemsRef)
    const categoria: CategoriaData = {
      id: newDocRef.id,
      ...data,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    }
    await setDoc(newDocRef, categoria)
    return categoria
  } catch (error) {
    console.error('[gerenciarServicos] Erro ao adicionar categoria:', error)
    throw error
  }
}

export async function updateCategoria(businessId: string, categoriaId: string, data: Partial<Omit<CategoriaData, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  try {
    const docRef = getItemDocPath(businessId, 'Categorias', categoriaId)
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() })
  } catch (error) {
    console.error('[gerenciarServicos] Erro ao atualizar categoria:', error)
    throw error
  }
}

export async function deleteCategorias(businessId: string, ids: string[]): Promise<void> {
  try {
    const batch = writeBatch(db)
    ids.forEach((id) => {
      batch.delete(getItemDocPath(businessId, 'Categorias', id))
    })
    await batch.commit()
  } catch (error) {
    console.error('[gerenciarServicos] Erro ao deletar categorias:', error)
    throw error
  }
}

// ============================================
// COMBOS (aba Combos)
// ============================================

export async function getCombos(businessId: string): Promise<ComboData[]> {
  try {
    const itemsRef = getItemsCollectionPath(businessId, 'Combos')
    const snapshot = await getDocs(itemsRef)
    const items: ComboData[] = []
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as ComboData)
    })
    return items
  } catch (error) {
    console.error('[gerenciarServicos] Erro ao buscar combos:', error)
    throw error
  }
}

export async function addCombo(businessId: string, data: Omit<ComboData, 'id' | 'createdAt' | 'updatedAt'>): Promise<ComboData> {
  try {
    await ensureTabDocument(businessId, 'Combos')
    const itemsRef = getItemsCollectionPath(businessId, 'Combos')
    const newDocRef = doc(itemsRef)
    const combo: ComboData = {
      id: newDocRef.id,
      ...data,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    }
    await setDoc(newDocRef, combo)
    return combo
  } catch (error) {
    console.error('[gerenciarServicos] Erro ao adicionar combo:', error)
    throw error
  }
}

export async function updateCombo(businessId: string, comboId: string, data: Partial<Omit<ComboData, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  try {
    const docRef = getItemDocPath(businessId, 'Combos', comboId)
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() })
  } catch (error) {
    console.error('[gerenciarServicos] Erro ao atualizar combo:', error)
    throw error
  }
}

export async function deleteCombos(businessId: string, ids: string[]): Promise<void> {
  try {
    const batch = writeBatch(db)
    ids.forEach((id) => {
      batch.delete(getItemDocPath(businessId, 'Combos', id))
    })
    await batch.commit()
  } catch (error) {
    console.error('[gerenciarServicos] Erro ao deletar combos:', error)
    throw error
  }
}

// ============================================
// CUPONS (aba Cupons)
// ============================================

export async function getCupons(businessId: string): Promise<CupomData[]> {
  try {
    const itemsRef = getItemsCollectionPath(businessId, 'Cupons')
    const snapshot = await getDocs(itemsRef)
    const items: CupomData[] = []
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as CupomData)
    })
    return items
  } catch (error) {
    console.error('[gerenciarServicos] Erro ao buscar cupons:', error)
    throw error
  }
}

export async function addCupom(businessId: string, data: Omit<CupomData, 'id' | 'createdAt' | 'updatedAt'>): Promise<CupomData> {
  try {
    await ensureTabDocument(businessId, 'Cupons')
    const itemsRef = getItemsCollectionPath(businessId, 'Cupons')
    const newDocRef = doc(itemsRef)
    const cupom: CupomData = {
      id: newDocRef.id,
      ...data,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    }
    await setDoc(newDocRef, cupom)
    return cupom
  } catch (error) {
    console.error('[gerenciarServicos] Erro ao adicionar cupom:', error)
    throw error
  }
}

export async function updateCupom(businessId: string, cupomId: string, data: Partial<Omit<CupomData, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  try {
    const docRef = getItemDocPath(businessId, 'Cupons', cupomId)
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() })
  } catch (error) {
    console.error('[gerenciarServicos] Erro ao atualizar cupom:', error)
    throw error
  }
}

export async function deleteCupons(businessId: string, ids: string[]): Promise<void> {
  try {
    const batch = writeBatch(db)
    ids.forEach((id) => {
      batch.delete(getItemDocPath(businessId, 'Cupons', id))
    })
    await batch.commit()
  } catch (error) {
    console.error('[gerenciarServicos] Erro ao deletar cupons:', error)
    throw error
  }
}

// ============================================
// PROMOÇÕES (aba Promoções)
// ============================================

export async function getPromocoes(businessId: string): Promise<PromocaoData[]> {
  try {
    const itemsRef = getItemsCollectionPath(businessId, 'Promocoes')
    const snapshot = await getDocs(itemsRef)
    const items: PromocaoData[] = []
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as PromocaoData)
    })
    return items
  } catch (error) {
    console.error('[gerenciarServicos] Erro ao buscar promoções:', error)
    throw error
  }
}

export async function addPromocao(businessId: string, data: Omit<PromocaoData, 'id' | 'createdAt' | 'updatedAt'>): Promise<PromocaoData> {
  try {
    await ensureTabDocument(businessId, 'Promocoes')
    const itemsRef = getItemsCollectionPath(businessId, 'Promocoes')
    const newDocRef = doc(itemsRef)
    const promocao: PromocaoData = {
      id: newDocRef.id,
      ...data,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    }
    await setDoc(newDocRef, promocao)
    return promocao
  } catch (error) {
    console.error('[gerenciarServicos] Erro ao adicionar promoção:', error)
    throw error
  }
}

export async function updatePromocao(businessId: string, promocaoId: string, data: Partial<Omit<PromocaoData, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  try {
    const docRef = getItemDocPath(businessId, 'Promocoes', promocaoId)
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() })
  } catch (error) {
    console.error('[gerenciarServicos] Erro ao atualizar promoção:', error)
    throw error
  }
}

export async function deletePromocoes(businessId: string, ids: string[]): Promise<void> {
  try {
    const batch = writeBatch(db)
    ids.forEach((id) => {
      batch.delete(getItemDocPath(businessId, 'Promocoes', id))
    })
    await batch.commit()
  } catch (error) {
    console.error('[gerenciarServicos] Erro ao deletar promoções:', error)
    throw error
  }
}
