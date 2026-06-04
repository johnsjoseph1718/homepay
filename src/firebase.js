import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirestore, doc, getDoc, setDoc, collection, onSnapshot, addDoc, serverTimestamp, query, where, orderBy, updateDoc, getDocs } from 'firebase/firestore';

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
let db;

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
    console.log('[HomePay] Initializing Firebase with valid credentials...');
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true
    });
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    console.log('[HomePay] Firebase and Firestore successfully initialized.');
  } catch (error) {
    console.error('[HomePay] Critical: Firebase failed to initialize:', error);
  }
} else {
  const missingOrInvalid = [];
  Object.entries(firebaseConfig).forEach(([key, value]) => {
    if (!value) missingOrInvalid.push(`${key} is MISSING`);
    else if (value.includes('YourApiKeyHere') || value === 'AIzaSyYourApiKeyHere') missingOrInvalid.push(`${key} is using default PLACEHOLDER`);
  });
  console.error('[HomePay] Critical: Firebase credentials are invalid or incomplete. Details:', missingOrInvalid.join(', '));
  console.warn('Firebase Warning: Firebase credentials are not fully configured yet. Google Sign-In and Firestore Sync will not be active.');
}

export { app, auth, googleProvider, db, doc, getDoc, setDoc, collection, onSnapshot, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, addDoc, serverTimestamp, query, where, orderBy, updateDoc, getDocs };

