// src/firebaseConfig.js

// 1. بنستدعي الدوال اللي محتاجينها بس
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";           // Authentication
import { getFirestore } from "firebase/firestore";   // Firestore (Cloud Firestore)
import { getDatabase } from "firebase/database";     // Realtime Database

// 2. بيانات مشروعك من موقع فايربيس
// (Project Settings -> General -> Your apps -> SDK setup and configuration)
const firebaseConfig = {
  apiKey: "AIzaSyB_js3WVq60KaJZb4QjyxHoCC6kf99eJXs",
  authDomain: "riftzone-53658.firebaseapp.com",
  databaseURL: "https://riftzone-53658-default-rtdb.firebaseio.com",
  projectId: "riftzone-53658",
  storageBucket: "riftzone-53658.firebasestorage.app",
  messagingSenderId: "347457067230",
  appId: "1:347457067230:web:0069d88f969ec06b20ca4f"
};

// 3. بنشغل التطبيق (Initialize App)
const app = initializeApp(firebaseConfig);

// 4. بنشغل الخدمات اللي طلبتها
const auth = getAuth(app);             // عشان تسجيل الدخول
const db = getFirestore(app);          // عشان Firestore
const rtdb = getDatabase(app); // 2. تصدير الـ Realtime DB (ده اللي كان ناقص)
// 5. بنعمل Export عشان نستخدمهم في باقي الصفحات
export { auth, db, rtdb };