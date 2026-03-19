import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

function validateFirebaseConfig(cfg: typeof firebaseConfig): string | null {
  const required: Array<keyof typeof cfg> = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];

  for (const key of required) {
    const v = cfg[key];
    if (!v || String(v).trim().length === 0) return `Missing env var for ${String(key)}`;
  }
  return null;
}

let initError: Error | null = null;
let app:
  | ReturnType<typeof initializeApp>
  | null = null;

try {
  const validationError = validateFirebaseConfig(firebaseConfig);
  if (validationError) throw new Error(validationError);

  app = initializeApp(firebaseConfig);
} catch (e) {
  initError = e instanceof Error ? e : new Error('Unknown Firebase init error');
}

// Важно: при ошибке инициализации это будут `null as any`,
// но приложение должно поймать `firebaseInitError` и показать понятный UI.
export const firebaseInitError = initError;
export const db = app ? (getFirestore(app) as any) : (null as any);
export const auth = app ? (getAuth(app) as any) : (null as any);
export const storage = app ? (getStorage(app) as any) : (null as any);