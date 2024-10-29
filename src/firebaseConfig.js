// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import Firestore

const firebaseConfig = {
  apiKey: "AIzaSyBdP9U9K37q-a3GUQrKS1hTXOP84w9yD_A",
  authDomain: "bambuu-e5b3d.firebaseapp.com",
  projectId: "bambuu-e5b3d",
  storageBucket: "bambuu-e5b3d.appspot.com",
  messagingSenderId: "307767240976",
  appId: "1:307767240976:web:c118e1aaa095c35a90dd95",
  measurementId: "G-F4E4NL282J",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore

export { auth, db };
