import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Konfigurasi Firebase dari Environment Variables
// Pastikan semua variable ini udah ada di .env.local lo ya!
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Singleton Pattern:
// We first check if the app already exists (getApps().length > 0).
// If it already exists, we use the running one (getApp()).
// If not, we initialize it again (initializeApp).
// Ini mencegah error "Firebase App named '[DEFAULT]' already exists" di Next.js dev mode (hot reload).
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export Auth instance biar bisa dipake di page lain (Login/Register)
const auth = getAuth(app);

export { app, auth };