import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Favorite {
  id: string
  userId: string
  businessId: string
  businessName: string
  businessImage?: string
  businessCategory?: string
  createdAt: any
}

export async function getFavorites(userId: string): Promise<Favorite[]> {
  const q = query(collection(db, 'favorites'), where('userId', '==', userId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Favorite))
}

export async function addFavorite(
  userId: string,
  business: { id: string; name: string; image?: string; category?: string }
): Promise<void> {
  const id = `${userId}_${business.id}`
  await setDoc(doc(db, 'favorites', id), {
    userId,
    businessId: business.id,
    businessName: business.name,
    businessImage: business.image ?? null,
    businessCategory: business.category ?? null,
    createdAt: serverTimestamp(),
  })
}

export async function removeFavorite(userId: string, businessId: string): Promise<void> {
  const id = `${userId}_${businessId}`
  await deleteDoc(doc(db, 'favorites', id))
}

export async function isFavorite(userId: string, businessId: string): Promise<boolean> {
  const id = `${userId}_${businessId}`
  const snap = await getDoc(doc(db, 'favorites', id))
  return snap.exists()
}
