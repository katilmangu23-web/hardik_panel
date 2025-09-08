import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBQxwEEyGO_VtDISomwPN_8j6ExUKfe1-M",
  authDomain: "rajesh-joshi-93589.firebaseapp.com",
  databaseURL:
    "https://rajesh-joshi-93589-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rajesh-joshi-93589",
  storageBucket: "rajesh-joshi-93589.firebasestorage.app",
  messagingSenderId: "266777667716",
  appId: "1:266777667716:web:4550d305e1fac4f695bad1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const database = getDatabase(app); // Realtime Database
export const firestore = getFirestore(app); // Firestore (for future use)
export const auth = getAuth(app); // Authentication

export default app;
