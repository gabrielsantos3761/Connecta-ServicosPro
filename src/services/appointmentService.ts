import {
  collection,
  doc,
  setDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  limit,
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
}

// ============================================
// HELPERS
// ============================================

function buildScheduledAt(date: string, time: string): Timestamp {
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  return Timestamp.fromDate(new Date(year, month - 1, day, hours, minutes, 0, 0))
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
    createdAt: now,
    updatedAt: now,
  })

  return docRef.id
}

// ============================================
// BUSCAR AGENDAMENTOS DO PROFISSIONAL
// ============================================

export async function getAppointmentsByProfessional(
  professionalId: string,
  fromDate?: Date
): Promise<Appointment[]> {
  const from = fromDate ?? new Date()
  from.setHours(0, 0, 0, 0)

  const q = query(
    collection(db, 'appointments'),
    where('professionalId', '==', professionalId),
    where('scheduledAt', '>=', Timestamp.fromDate(from)),
    orderBy('scheduledAt', 'asc'),
    limit(50)
  )

  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment))
}

// ============================================
// BUSCAR AGENDAMENTOS DO ESTABELECIMENTO
// ============================================

export async function getAppointmentsByBusiness(
  businessId: string,
  fromDate?: Date
): Promise<Appointment[]> {
  const from = fromDate ?? new Date()
  from.setHours(0, 0, 0, 0)

  const q = query(
    collection(db, 'appointments'),
    where('businessId', '==', businessId),
    where('scheduledAt', '>=', Timestamp.fromDate(from)),
    orderBy('scheduledAt', 'asc'),
    limit(100)
  )

  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment))
}
