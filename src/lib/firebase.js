
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/** Live bindings — assigned after ensureFirebase() completes. */
export let auth = null;
export let db = null;
export let googleProvider = null;

let initPromise = null;
let initError = null;

function viteConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
}

export function isFirebaseConfigComplete(cfg) {
  return !!(cfg?.apiKey && cfg?.authDomain && cfg?.projectId);
}

async function loadConfig() {
  const fromVite = viteConfig();
  if (isFirebaseConfigComplete(fromVite)) return fromVite;

  const res = await fetch('/api/public-config');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Firebase config unavailable (${res.status})`);
  }
  return res.json();
}

function applyConfig(config) {
  const app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  return { auth, db, googleProvider };
}

/** Call once before rendering the app (and safe to call multiple times). */
export async function ensureFirebase() {
  if (auth) return { auth, db, googleProvider };
  if (initError) throw initError;
  if (!initPromise) {
    initPromise = loadConfig()
      .then(applyConfig)
      .catch((err) => {
        initError = err;
        initPromise = null;
        throw err;
      });
  }
  return initPromise;
}

export function getFirebaseInitError() {
  return initError;
}
