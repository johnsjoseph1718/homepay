import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app;
let auth;
let googleProvider;

console.log("Firebase Env Check:", {
  apiKey: firebaseConfig.apiKey ? "LOADED" : "MISSING",
  authDomain: firebaseConfig.authDomain ? "LOADED" : "MISSING",
  projectId: firebaseConfig.projectId ? "LOADED" : "MISSING",
  storageBucket: firebaseConfig.storageBucket ? "LOADED" : "MISSING",
  messagingSenderId: firebaseConfig.messagingSenderId ? "LOADED" : "MISSING",
  appId: firebaseConfig.appId ? "LOADED" : "MISSING"
});

const isConfigValid = firebaseConfig.apiKey && 
                      firebaseConfig.apiKey !== 'AIzaSyYourApiKeyHere' && 
                      !firebaseConfig.apiKey.includes('YourApiKeyHere');

if (isConfigValid) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
  } catch (error) {
    console.error('Firebase failed to initialize:', error);
  }
} else {
  console.warn('Firebase Warning: Firebase credentials are not fully configured yet. Google Sign-In will not be active.');
}

export { app, auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged };

