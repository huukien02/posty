import admin from "firebase-admin";

// Khởi tạo Firebase Admin một lần duy nhất, đọc service account từ biến môi trường.
// FIREBASE_SERVICE_ACCOUNT_BASE64 = base64 của file service-account JSON.
function getServiceAccount(): admin.ServiceAccount {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!b64) {
    throw new Error(
      "Thiếu FIREBASE_SERVICE_ACCOUNT_BASE64 trong biến môi trường",
    );
  }
  const json = Buffer.from(b64, "base64").toString("utf8");
  return JSON.parse(json) as admin.ServiceAccount;
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(getServiceAccount()),
  });
}

export const adminApp = admin.app();
export const adminDb = admin.firestore();
export const adminMessaging = admin.messaging();
export default admin;
