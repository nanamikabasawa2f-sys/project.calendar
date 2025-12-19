import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore'; 
import { getAuth } from 'firebase/auth'; 

const firebaseConfig = {
  apiKey: "AIzaSyBWWz4uY9-mOoIyakvT9x2lUoM9iIF6HoM",
  authDomain: "project-2025-b92e7.firebaseapp.com",
  projectId: "project-2025-b92e7",
  storageBucket: "project-2025-b92e7.firebasestorage.app",
  messagingSenderId: "567550693268",
  appId: "1:567550693268:web:b4a62977f57fe06cfd4981",
  measurementId: "G-Y5P08V9MEH"
};

const app = initializeApp(firebaseConfig);

// 他のファイルで使えるように、dbとauthをエクスポートします
export const db = getFirestore(app);
export const auth = getAuth(app); // ★これを使ってログイン状態を判別します