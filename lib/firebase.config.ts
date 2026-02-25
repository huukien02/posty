import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAtsAuBa6X20MuzTLzWkEADnKPv6VosEYU",
  authDomain: "coffee-9a1f8.firebaseapp.com",
  projectId: "coffee-9a1f8",
  storageBucket: "coffee-9a1f8.firebasestorage.app",
  messagingSenderId: "2316025268",
  appId: "1:2316025268:web:62100ecee836a6c450c6e1",
  measurementId: "G-L9QQGQM6BC",
  databaseURL: "https://coffee-9a1f8-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app); // Firestore
export const rtdb = getDatabase(app); // Realtime Database
export const auth = getAuth(app);

// 🔹 Firebase Messaging (chỉ client-side)
export let messaging: ReturnType<typeof getMessaging> | null = null;
if (typeof window !== "undefined") {
  messaging = getMessaging(app);
}

// 🔹 Lấy token để gửi notification từ server
export async function requestNotificationPermission() {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const token = await getToken(messaging, {
      vapidKey: "YOUR_WEB_PUSH_CERTIFICATE_KEY_PAIR", // từ Firebase Console → Cloud Messaging
    });

    return token;
  } catch (err) {
    console.error("FCM getToken error:", err);
    return null;
  }
}

// 🔹 Lắng nghe foreground messages
export function onMessageListener(callback: (payload: any) => void) {
  if (!messaging) return;
  onMessage(messaging, callback);
}
