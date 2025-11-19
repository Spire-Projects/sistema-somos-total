import {  initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA1ID09MZOhCUBh147ArPpFY9NEM83eeY0",
  authDomain: "farmacia-la-bonita.firebaseapp.com",
  projectId: "farmacia-la-bonita",
  storageBucket: "farmacia-la-bonita.firebasestorage.app",
  messagingSenderId: "324702190943",
  appId: "1:324702190943:web:29d99c1b90acb20dcccaea",
  measurementId: "G-C8WYD3Q1SF"
};

const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
