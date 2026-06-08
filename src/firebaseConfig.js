import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

let auth = null;
let firebaseAvailable = true;

try {
  // initializeApp will throw if config is invalid in some runtimes
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (err) {
  // Fail gracefully for local dev when env vars are missing
  // Consumer can check `firebaseAvailable` and avoid hanging UI
  // eslint-disable-next-line no-console
  console.warn("Firebase not initialized:", err?.message || err);
  firebaseAvailable = false;
}

export { auth, firebaseAvailable };
