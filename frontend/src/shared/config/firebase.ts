import { getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA1ID09MZOhCUBh147ArPpFY9NEM83eeY0",
  authDomain: "farmacia-la-bonita.firebaseapp.com",
  projectId: "farmacia-la-bonita",
  storageBucket: "farmacia-la-bonita.firebasestorage.app",
  messagingSenderId: "324702190943",
  appId: "1:324702190943:web:96850e898fb64228cccaea",
  measurementId: "G-R5NP8Y9BZC"
};

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const firestore = getFirestore(firebaseApp);
