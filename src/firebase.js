import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Sigal Media Firebase Yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyDNA6j76_dJn1RCwTR2m_FGPYgwvrh4m8o",
  authDomain: "sigalmedia.firebaseapp.com",
  databaseURL: "https://sigalmedia-default-rtdb.firebaseio.com",
  projectId: "sigalmedia",
  storageBucket: "sigalmedia.firebasestorage.app",
  messagingSenderId: "805868320729",
  appId: "1:805868320729:web:925496adac6845fbeb4bc8"
};

// Firebase'i Başlat
const app = initializeApp(firebaseConfig);

// Servisleri Dışa Aktar
export const db = getFirestore(app);
export const storage = getStorage(app);
