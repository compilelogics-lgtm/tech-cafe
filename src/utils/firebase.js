import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage"; // ✅ added storage import

const firebaseConfig = {
  apiKey: "AIzaSyCRokPMew3jp1TKDZvOg9_iyUCGQISFMO4",
  authDomain: "tech-cafe-event-dev.firebaseapp.com",
  projectId: "tech-cafe-event-dev",
  storageBucket: "tech-cafe-event-dev.firebasestorage.app",
  messagingSenderId: "150523353619",
  appId: "1:150523353619:web:d7004a01bebcf86e087de6"
};
// VITE_FIREBASE_API_KEY=AIzaSyCRokPMew3jp1TKDZvOg9_iyUCGQISFMO4
// VITE_FIREBASE_AUTH_DOMAIN=tech-cafe-event-dev.firebaseapp.com
// VITE_FIREBASE_PROJECT_ID=tech-cafe-event-dev
// VITE_FIREBASE_STORAGE_BUCKET=tech-cafe-event-dev.firebasestorage.app
// VITE_FIREBASE_MESSAGING_SENDER_ID=150523353619
// VITE_FIREBASE_APP_ID=1:150523353619:web:d7004a01bebcf86e087de6

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); // ✅ initialize storage

// ✅ Setup Functions
const functions =
  import.meta.env.MODE === "development"
    ? getFunctions(app)
    : getFunctions(app, "us-central1");

// ✅ Connect to emulators *only* in dev mode
if (import.meta.env.MODE === "development") {
  console.log("⚙️ Connecting Firebase to local emulators...");
  connectFirestoreEmulator(db, "localhost", 8080);
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFunctionsEmulator(functions, "localhost", 5001);
  connectStorageEmulator(storage, "localhost", 9199); // ✅ added this
}

export { app, db, auth, storage, functions, httpsCallable };
