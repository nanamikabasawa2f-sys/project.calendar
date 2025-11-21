// src/firebase.js

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore'; 

// ★★★ ここにFirebaseコンソールで取得した設定情報を貼り付けてください ★★★
const firebaseConfig = {
  apiKey: "AIzaSyB-PK4-yYv34VrQM8ulnDOxtGghIoOW4Y8",
  authDomain: "project-2025-b92e7.firebaseapp.com",
  projectId: "project-2025-b92e7",
  storageBucket: "project-2025-b92e7.firebasestorage.app",
  messagingSenderId: "567550693268",
  appId: "1:567550693268:web:b4a62977f57fe06cfd4981",
  measurementId: "G-Y5P08V9MEH"
};
// ★★★ 貼り付けはここまで ★★★

// Firebaseを初期化
const app = initializeApp(firebaseConfig);

// Firestoreデータベースへの参照を取得
export const db = getFirestore(app);

// この db を App.js でインポートして使用します

//const analytics = getAnalytics(app);