import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration (updated)
const firebaseConfig = {
  apiKey: "AIzaSyD359z8RNJyDxMoD0jHzNWLBpADDatOQtA",
  authDomain: "hardik-44403.firebaseapp.com",
  databaseURL: "https://hardik-44403-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hardik-44403",
  storageBucket: "hardik-44403.firebasestorage.app",
  messagingSenderId: "1033064814660",
  appId: "1:1033064814660:web:659ae7cf8873ac895c4411"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const database = getDatabase(app); // Realtime Database
export const firestore = getFirestore(app); // Firestore (for future use)
export const auth = getAuth(app); // Authentication

export default app;
