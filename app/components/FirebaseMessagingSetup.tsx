"use client";

import { useEffect } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { initializeApp } from "firebase/app";

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
export default function FirebaseMessagingSetup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js"
        );
        console.log("Service Worker registered:", registration);

        const messaging = getMessaging(app);

        // Lấy device token
        const token = await getToken(messaging, {
          vapidKey:
            "BABGj89Iz012ZOTTYPDwo46uHzF96LGbLernupXvvMEwE4V022rdyMPS-9UjTo8nHBUPUY4rY7tyZk3Q_Wqd-uo",
        });

        console.log("FCM Device token:", token);

        // Lắng nghe notification khi app đang mở
        onMessage(messaging, (payload) => {
          console.log("Foreground message received:", payload);

          if (payload.notification) {
            new Notification(payload.notification.title || "", {
              body: payload.notification.body,
              icon: "/favicon.ico",
            });
          }
        });
      } catch (err) {
        console.error("Error registering SW or getting FCM token:", err);
      }
    };

    registerSW();
  }, []);

  return null;
}
