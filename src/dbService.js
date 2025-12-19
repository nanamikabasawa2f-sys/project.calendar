// src/dbService.js
import { db, auth } from './firebase';
import { collection, addDoc, onSnapshot, query } from "firebase/firestore";

// 予定を保存する関数
export const saveEventToFirebase = async (eventData) => {
  if (!auth.currentUser) return;
  const userEventsRef = collection(db, "users", auth.currentUser.uid, "events");
  return await addDoc(userEventsRef, eventData);
};

// 予定をリアルタイムで取得する関数（購読）
export const subscribeToEvents = (uid, callback) => {
  const q = query(collection(db, "users", uid, "events"));
  return onSnapshot(q, (snapshot) => {
    const loadedEvents = {};
    snapshot.forEach((doc) => {
      const data = doc.data();
      const dateKey = data.dateKey;
      if (!loadedEvents[dateKey]) loadedEvents[dateKey] = [];
      loadedEvents[dateKey].push({ id: doc.id, ...data });
    });
    callback(loadedEvents);
  });
};