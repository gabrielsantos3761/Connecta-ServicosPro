import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

// ============================================
// TIPOS
// ============================================

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface Appointment {
  id: string
  businessId: string
  businessName: string
  professionalId: string
  professionalName?: string
  clientId: string
  clientName: string
  serviceId: string
  serviceName: string
  servicePrice: number
  serviceDuration: number
  serviceDescription?: string
  date: string       // YYYY-MM-DD
  time: string       // HH:MM
  scheduledAt: Timestamp
  paymentMethod: string
  status: AppointmentStatus
  paymentType?: 'fixed' | 'percentage' | null
  commissionPercent?: number | null
  professionalAmount?: number
  businessAmount?: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface CreateAppointmentData {
  businessId: string
  businessName: string
  professionalId: string
  professionalName?: string
  clientId: string
  clientName: string
  serviceId: string
  serviceName: string
  servicePrice: number
  serviceDuration: number
  serviceDescription?: string
  date: string
  time: string
  paymentMethod: string
  paymentType?: 'fixed' | 'percentage' | null
  commissionPercent?: number | null
  professionalAmount?: number | null
  businessAmount?: number | null
}

// ============================================
// HELPERS
// ============================================

function buildScheduledAt(date: string, time: string): Timestamp {
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  return Timestamp.fromDate(new Date(year, month - 1, day, hours, minutes, 0, 0))
}

/** Ordena appointments por data+hora crescente */
function sortByScheduledAt(a: Appointment, b: Appointment): number {
  return a.date.localeCompare(b.date) || a.time.localeCompare(b.time)
}

// ============================================
// CRIAR AGENDAMENTO
// ============================================

export async function createAppointment(data: CreateAppointmentData): Promise<string> {
  const now = Timestamp.now()
  const scheduledAt = buildScheduledAt(data.date, data.time)

  const docRef = doc(collection(db, 'appointments'))

  await setDoc(docRef, {
    id: docRef.id,
    businessId: data.businessId,
    businessName: data.businessName,
    professionalId: data.professionalId,
    professionalName: data.professionalName ?? '',
    clientId: data.clientId,
    clientName: data.clientName,
    serviceId: data.serviceId,
    serviceName: data.serviceName,
    servicePrice: data.servicePrice,
    serviceDuration: data.serviceDuration,
    serviceDescription: data.serviceDescription ?? '',
    date: data.date,
    time: data.time,
    scheduledAt,
    paymentMethod: data.paymentMethod,
    status: 'pending' as AppointmentStatus,
    paymentType: data.paymentType ?? null,
    commissionPercent: data.commissionPercent ?? null,
    professionalAmount: data.professionalAmount ?? null,
    businessAmount: data.businessAmount ?? null,
    createdAt: now,
    updatedAt: now,
  })

  return docRef.id
}

// ============================================
// BUSCAR AGENDAMENTOS DO PROFISSIONAL
// Usa apenas where de igualdade (sem índice composto)
// Filtragem por data feita no cliente
// ============================================

export async function getAppointmentsByProfessional(
  professionalId: string,
  fromDate?: Date
): Promise<Appointment[]> {
  const q = query(
    collection(db, 'appointments'),
    where('professionalId', '==', professionalId),
  )

  const snap = await getDocs(q)
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment))

  const from = fromDate ? new Date(fromDate) : new Date()
  from.setHours(0, 0, 0, 0)
  const fromStr = from.toISOString().split('T')[0]

  return all
    .filter(a => a.date >= fromStr)
    .sort(sortByScheduledAt)
}

// ============================================
// BUSCAR AGENDAMENTOS DO ESTABELECIMENTO
// Usa apenas where de igualdade (sem índice composto)
// Filtragem por data feita no cliente
// ============================================

export async function getAppointmentsByBusiness(
  businessId: string,
  fromDate?: Date,
  toDate?: Date
): Promise<Appointment[]> {
  const q = query(
    collection(db, 'appointments'),
    where('businessId', '==', businessId),
  )

  const snap = await getDocs(q)
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment))

  const from = fromDate ? new Date(fromDate) : new Date()
  from.setHours(0, 0, 0, 0)
  const fromStr = from.toISOString().split('T')[0]

  let result = all.filter(a => a.date >= fromStr)

  if (toDate) {
    const to = new Date(toDate)
    to.setHours(23, 59, 59, 999)
    const toStr = to.toISOString().split('T')[0]
    result = result.filter(a => a.date <= toStr)
  }

  return result.sort(sortByScheduledAt)
}
