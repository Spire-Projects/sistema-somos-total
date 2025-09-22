import { getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
 apiKey: "AIzaSyCbBE2Lk8vl776YbeVyXR0NEWd3b-CkVOg",
  authDomain: "snappy-beaker-451709-m5.firebaseapp.com",
  projectId: "snappy-beaker-451709-m5",
  storageBucket: "snappy-beaker-451709-m5.firebasestorage.app",
  messagingSenderId: "727621961259",
  appId: "1:727621961259:web:522003338f553d21200c6e",
  measurementId: "G-PMQY1NBFL6"
};

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const firestore = getFirestore(firebaseApp);
