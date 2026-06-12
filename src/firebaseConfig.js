import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const firebaseAvailable = Object.values(firebaseConfig).every(Boolean);


console.log(firebaseConfig);
console.log("Firebase available:", firebaseAvailable);


const app = firebaseAvailable ? initializeApp(firebaseConfig) : null;
export const auth = firebaseAvailable ? getAuth(app) : null;


export {firebaseAvailable};
export default app;


