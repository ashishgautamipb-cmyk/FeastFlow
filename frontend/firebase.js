// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// FeastFlow Firebase Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "vingo-food-delivery-4e86d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "vingo-food-delivery-4e86d",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "vingo-food-delivery-4e86d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "321148148358",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:321148148358:web:f09e1e5bee8ecadeb8cf07",
};

let app = null;
let auth = null;

try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  }
} catch (error) {
  console.warn("Firebase initialization skipped or failed:", error.message);
}

export { app, auth };
