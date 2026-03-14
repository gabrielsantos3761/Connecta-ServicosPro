/**
 * Service para gerenciar vínculos entre profissionais e estabelecimentos
 * Coleção: professional_links
 */
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  deleteField,
  serverTimestamp,
  Timestamp,
  orderBy
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

// ============================================
// INTERFACES
// ============================================

export type LinkStatus = 'pending' | 'active' | 'rejected' | 'inactive'
export type LinkedBy = 'code' | 'qrcode' | 'invite'

export interface WorkScheduleDay {
  day: string       // 'monday', 'tuesday', etc.
  start: string     // '09:00'
  end: string       // '18:00'
  isActive: boolean
}

export interface ProfessionalLink {
  id: string
  professionalId: string
  professionalName: string
  professionalEmail: string
  professionalAvatar?: string
  businessId: string
  businessName: string
  status: LinkStatus
  role?: string                    // ex: "barbeiro", "manicure"
  servicesOffered?: string[]       // IDs dos serviços que oferece naquele local
  workSchedule?: WorkScheduleDay[]
  commission?: number              // % de comissão
  paymentType?: 'fixed' | 'percentage' // tipo de pagamento do profissional
  fixedMonthly?: number            // valor do salário fixo mensal (quando paymentType === 'fixed')
  linkedBy: LinkedBy
  linkedAt: Timestamp
  updatedAt: Timestamp
  reviewedAt?: Timestamp           // quando o owner aprovou/rejeitou
  reviewedBy?: string              // UID do owner que aprovou
}

export interface CreateLinkData {
  professionalId: string
  professionalName: string
  professionalEmail: string
  professionalAvatar?: string
  businessId: string
  businessName: string
  linkedBy: LinkedBy
  status?: LinkStatus  // default: 'pending', owner pode criar como 'active'
}

// ============================================
// REFERÊNCIA DA COLEÇÃO
// ============================================

const COLLECTION_NAME = 'professional_links'
const linksCollection = collection(db, COLLECTION_NAME)

// ============================================
// CRIAR VÍNCULO (profissional solicita)
// ============================================

export async function createProfessionalLink(data: CreateLinkData): Promise<string> {
  // Verificar se já existe um vínculo ativo ou pendente
  const existingLink = await getExistingLink(data.professionalId, data.businessId)

  if (existingLink) {
    if (existingLink.status === 'active') {
      throw new Error('Você já está vinculado a este estabelecimento.')
    }
    if (existingLink.status === 'pending') {
      throw new Error('Você já possui uma solicitação pendente para este estabelecimento.')
    }
    // Se foi rejeitado ou inativo, pode solicitar novamente - remove o antigo
    await deleteDoc(doc(db, COLLECTION_NAME, existingLink.id))
  }

  const linkData = {
    professionalId: data.professionalId,
    professionalName: data.professionalName,
    professionalEmail: data.professionalEmail,
    professionalAvatar: data.professionalAvatar || null,
    businessId: data.businessId,
    businessName: data.businessName,
    status: (data.status || 'pending') as LinkStatus,
    linkedBy: data.linkedBy,
    servicesOffered: [],
    workSchedule: [],
    linkedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const docRef = await addDoc(linksCollection, linkData)
  return docRef.id
}

// ============================================
// VERIFICAR VÍNCULO EXISTENTE (e limpar duplicatas)
// ============================================

async function getExistingLink(
  professionalId: string,
  businessId: string
): Promise<ProfessionalLink | null> {
  const q = query(
    linksCollection,
    where('professionalId', '==', professionalId),
    where('businessId', '==', businessId)
  )

  const snapshot = await getDocs(q)

  if (snapshot.empty) return null

  // Se houver duplicatas, manter apenas o primeiro e deletar o resto
  if (snapshot.docs.length > 1) {
    const duplicates = snapshot.docs.slice(1)
    for (const dup of duplicates) {
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, dup.id))
      } catch { /* ignora erro ao limpar duplicata */ }
    }
  }

  const docSnap = snapshot.docs[0]
  return { id: docSnap.id, ...docSnap.data() } as ProfessionalLink
}

// ============================================
// DEDUPLICAR LINKS (por professionalId + businessId)
// ============================================

function deduplicateLinks(links: ProfessionalLink[]): ProfessionalLink[] {
  const seen = new Map<string, ProfessionalLink>()

  for (const link of links) {
    const key = `${link.professionalId}_${link.businessId}`
    const existing = seen.get(key)

    if (!existing) {
      seen.set(key, link)
    } else {
      // Priorizar: active > pending > outros
      const priority: Record<string, number> = { active: 3, pending: 2, rejected: 1, inactive: 0 }
      if ((priority[link.status] || 0) > (priority[existing.status] || 0)) {
        seen.set(key, link)
      }
    }
  }

  return Array.from(seen.values())
}

// ============================================
// APROVAR / REJEITAR VÍNCULO (owner)
// ============================================

export async function approveProfessionalLink(
  linkId: string,
  ownerUid: string
): Promise<void> {
  const linkRef = doc(db, COLLECTION_NAME, linkId)

  await updateDoc(linkRef, {
    status: 'active',
    reviewedAt: serverTimestamp(),
    reviewedBy: ownerUid,
    updatedAt: serverTimestamp(),
  })
}

export async function rejectProfessionalLink(
  linkId: string,
  ownerUid: string
): Promise<void> {
  const linkRef = doc(db, COLLECTION_NAME, linkId)

  await updateDoc(linkRef, {
    status: 'rejected',
    reviewedAt: serverTimestamp(),
    reviewedBy: ownerUid,
    updatedAt: serverTimestamp(),
  })
}

// ============================================
// DESATIVAR VÍNCULO
// ============================================

export async function deactivateProfessionalLink(linkId: string): Promise<void> {
  const linkRef = doc(db, COLLECTION_NAME, linkId)

  await updateDoc(linkRef, {
    status: 'inactive',
    updatedAt: serverTimestamp(),
  })
}

// ============================================
// DELETAR VÍNCULO (desvincular profissional do estabelecimento)
// Remove permanentemente — profissional pode re-vincular no futuro
// ============================================

export async function deleteProfessionalLink(linkId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION_NAME, linkId))
}

export async function deleteProfessionalLinks(linkIds: string[]): Promise<void> {
  await Promise.all(linkIds.map(id => deleteDoc(doc(db, COLLECTION_NAME, id))))
}

// ============================================
// BUSCAR VÍNCULOS DO PROFISSIONAL
// ============================================

export async function getLinksByProfessional(
  professionalId: string,
  status?: LinkStatus
): Promise<ProfessionalLink[]> {
  let q

  if (status) {
    q = query(
      linksCollection,
      where('professionalId', '==', professionalId),
      where('status', '==', status)
    )
  } else {
    q = query(
      linksCollection,
      where('professionalId', '==', professionalId)
    )
  }

  const snapshot = await getDocs(q)
  const allLinks = snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  })) as ProfessionalLink[]

  return deduplicateLinks(allLinks)
}

// ============================================
// BUSCAR VÍNCULOS DO ESTABELECIMENTO
// ============================================

export async function getLinksByBusiness(
  businessId: string,
  status?: LinkStatus
): Promise<ProfessionalLink[]> {
  let q

  if (status) {
    q = query(
      linksCollection,
      where('businessId', '==', businessId),
      where('status', '==', status)
    )
  } else {
    q = query(
      linksCollection,
      where('businessId', '==', businessId)
    )
  }

  const snapshot = await getDocs(q)
  const allLinks = snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  })) as ProfessionalLink[]

  return deduplicateLinks(allLinks)
}

// ============================================
// BUSCAR VÍNCULO ESPECÍFICO
// ============================================

export async function getLinkById(linkId: string): Promise<ProfessionalLink | null> {
  const linkRef = doc(db, COLLECTION_NAME, linkId)
  const linkSnap = await getDoc(linkRef)

  if (!linkSnap.exists()) return null

  return { id: linkSnap.id, ...linkSnap.data() } as ProfessionalLink
}

// ============================================
// ATUALIZAR DADOS DO VÍNCULO (horário, comissão, etc.)
// ============================================

export async function updateLinkDetails(
  linkId: string,
  data: Partial<Pick<ProfessionalLink, 'role' | 'servicesOffered' | 'workSchedule' | 'commission' | 'paymentType' | 'fixedMonthly'>>
): Promise<void> {
  const linkRef = doc(db, COLLECTION_NAME, linkId)

  // Replace undefined values with deleteField() to clean up Firestore
  const updateData: Record<string, unknown> = { updatedAt: serverTimestamp() }
  for (const [key, value] of Object.entries(data)) {
    updateData[key] = value === undefined ? deleteField() : value
  }

  await updateDoc(linkRef, updateData)
}

// ============================================
// BUSCAR VÍNCULO POR PROFISSIONAL + ESTABELECIMENTO (read-only)
// ============================================

export async function getLinkByProfessionalAndBusiness(
  professionalId: string,
  businessId: string
): Promise<ProfessionalLink | null> {
  const q = query(
    linksCollection,
    where('professionalId', '==', professionalId),
    where('businessId', '==', businessId)
  )

  const snapshot = await getDocs(q)
  if (snapshot.empty) return null

  const docSnap = snapshot.docs[0]
  return { id: docSnap.id, ...docSnap.data() } as ProfessionalLink
}

// ============================================
// BUSCAR BUSINESS POR CÓDIGO DE VINCULAÇÃO
// ============================================

// ============================================
// LIMPAR VÍNCULOS DUPLICADOS DE UM BUSINESS
// ============================================

export async function cleanDuplicateLinks(businessId: string): Promise<number> {
  const q = query(
    linksCollection,
    where('businessId', '==', businessId)
  )

  const snapshot = await getDocs(q)
  const allLinks = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ProfessionalLink[]

  const seen = new Map<string, string>() // key -> kept doc id
  let deletedCount = 0

  for (const link of allLinks) {
    const key = `${link.professionalId}_${link.businessId}`
    if (!seen.has(key)) {
      seen.set(key, link.id)
    } else {
      // Duplicata - deletar
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, link.id))
        deletedCount++
      } catch { /* ignora */ }
    }
  }

  return deletedCount
}

export async function getBusinessByLinkCode(code: string): Promise<{ id: string; name: string } | null> {
  // O código de vinculação é armazenado no documento do business
  const businessesRef = collection(db, 'businesses')
  const q = query(businessesRef, where('linkCode', '==', code))
  const snapshot = await getDocs(q)

  if (snapshot.empty) return null

  const businessDoc = snapshot.docs[0]
  const data = businessDoc.data()

  return {
    id: businessDoc.id,
    name: data.name,
  }
}
