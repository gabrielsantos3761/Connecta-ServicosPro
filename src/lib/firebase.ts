// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Firebase configuration object
// Você obterá essas credenciais no Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'southamerica-east1');

// Configurar persistência de autenticação
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Erro ao configurar persistência de autenticação:', error);
});

// Log de estado de autenticação para debug
onAuthStateChanged(auth, (user) => {
  console.log('[Firebase] onAuthStateChanged:', user ? `User ${user.uid}` : 'No user');
});

// NÃO conectar ao emulador a menos que explicitamente configurado
// connectFirestoreEmulator(db, 'localhost', 8080);

export default app;
