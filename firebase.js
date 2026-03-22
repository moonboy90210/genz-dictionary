// firebase.js
// Firebase config is intentionally public — it identifies the project only.
// Access control is enforced by Firestore + RTDB security rules, not this key.

import { initializeApp }         from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth,
         onAuthStateChanged,
         signInWithEmailAndPassword,
         createUserWithEmailAndPassword,
         signOut }               from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore,
         doc, getDoc, setDoc, updateDoc, deleteDoc,
         collection, query, where, getDocs,
         addDoc, serverTimestamp,
         increment }             from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getDatabase,
         ref, get, set, push,
         update, remove }        from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCxVtUC",
  authDomain:        "gen-z-dict.firebaseapp.com",
  databaseURL:       "https://gen-z-dict-default-rtdb.firebaseio.com",
  projectId:         "gen-z-dict",
  storageBucket:     "gen-z-dict.firebasestorage.app",
  messagingSenderId: "364875724733",
  appId:             "1:364875724733:web:fff485f679e9ab5f3204d4",
  measurementId:     "G-GX9PGQE0SV"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const rtdb = getDatabase(app);

export {
  // auth
  auth, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
  // firestore
  db, doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs, addDoc,
  serverTimestamp, increment,
  // realtime db
  rtdb, ref, get, set, push, update, remove
};