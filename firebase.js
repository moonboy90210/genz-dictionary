import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCxVtUC0sxmSVTDVRf6GUyBeT8MNEGIkNE",
  authDomain: "gen-z-dict.firebaseapp.com",
  databaseURL: "https://gen-z-dict-default-rtdb.firebaseio.com",
  projectId: "gen-z-dict",
  storageBucket: "gen-z-dict.firebasestorage.app",
  messagingSenderId: "364875724733",
  appId: "1:364875724733:web:fff485f679e9ab5f3204d4",
  measurementId: "G-GX9PGQE0SV"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);