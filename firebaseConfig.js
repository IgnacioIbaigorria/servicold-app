// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBSg4rpodmXyYLWNIUY-q0pdHUrjML8JFU",
  authDomain: "app-barcode-abd3c.firebaseapp.com",
  projectId: "app-barcode-abd3c",
  storageBucket: "app-barcode-abd3c.appspot.com",
  messagingSenderId: "1010244402173",
  appId: "1:1010244402173:android:d0ab2ce54a1734caadb794",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar Firestore
export const firestore = getFirestore(app);
