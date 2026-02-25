importScripts(
  "https://www.gstatic.com/firebasejs/10.13.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyAtsAuBa6X20MuzTLzWkEADnKPv6VosEYU",
  authDomain: "coffee-9a1f8.firebaseapp.com",
  projectId: "coffee-9a1f8",
  storageBucket: "coffee-9a1f8.firebasestorage.app",
  messagingSenderId: "2316025268",
  appId: "1:2316025268:web:62100ecee836a6c450c6e1",
  measurementId: "G-L9QQGQM6BC",
  databaseURL: "https://coffee-9a1f8-default-rtdb.firebaseio.com",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log("📩 Background message received:", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
