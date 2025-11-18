import {  initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD4q6aiFVnmgPUcXkmnj7pl9BFfRRIdLrU",
  authDomain: "desarrollo-en-la-nube-3e769.firebaseapp.com",
  projectId: "desarrollo-en-la-nube-3e769",
  storageBucket: "desarrollo-en-la-nube-3e769.firebasestorage.app",
  messagingSenderId: "703499156142",
  appId: "1:703499156142:web:c8116435272a8671040b3f",
  measurementId: "G-JL37Z6K3Y0"
};

const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
