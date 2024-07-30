// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore, doc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDCDoa_Em-C2H6ZvT0_eTLMys-TLInl0f4",
  authDomain: "chess-mate-44af1.firebaseapp.com",
  projectId: "chess-mate-44af1",
  storageBucket: "chess-mate-44af1.appspot.com",
  messagingSenderId: "572199289854",
  appId: "1:572199289854:web:2616585118b17215a136af"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, doc, updateDoc, onSnapshot, signInAnonymously, onAuthStateChanged };
