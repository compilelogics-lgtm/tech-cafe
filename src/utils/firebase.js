import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCIvTSHgMzgVfMUGFpO-YeV4tM96wpreDc",
  authDomain: "web-test-bd1e3.firebaseapp.com",
  projectId: "web-test-bd1e3",
  storageBucket: "web-test-bd1e3.firebasestorage.app",
  messagingSenderId: "559844878637",
  appId: "1:559844878637:web:fd5c8b7007ad1eca824ba4",
  measurementId: "G-LW5F6BDNCL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Always specify region explicitly
const functions = getFunctions(app, "us-central1");

// Connect to emulators in development
if (import.meta.env.MODE === "development") {
  console.log("⚙️ Connecting Firebase to local emulators...");
  connectFirestoreEmulator(db, "localhost", 8080);
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFunctionsEmulator(functions, "localhost", 5001);
  connectStorageEmulator(storage, "localhost", 9199);
}

export { app, db, auth, storage, functions };
