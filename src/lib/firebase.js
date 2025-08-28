import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBnl4W66ejQKWbAaST2q7n5sLBd51FV62Y",
  authDomain: "the-classic-dungeon.firebaseapp.com",
  projectId: "the-classic-dungeon",
  storageBucket: "the-classic-dungeon.firebasestorage.app",
  messagingSenderId: "411626699353",
  appId: "1:411626699353:web:25c211af06a1e177bdcf48"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);