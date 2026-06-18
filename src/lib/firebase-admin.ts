import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function initAdmin() {
  if (getApps().length > 0) return;
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccount) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not set");
  }
  initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
}

export function getDb() {
  initAdmin();
  return getFirestore();
}

export function nowTimestamp() {
  const now = new Date();
  return {
    display: now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }).replace(/\//g, "/").replace(",", ""),
    unix: now.getTime(),
  };
}
