import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getDatabase } from "firebase-admin/database";

function initAdmin() {
  if (getApps().length > 0) return;
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccount) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not set");
  }
  const projectId = JSON.parse(serviceAccount).project_id as string;
  initializeApp({
    credential: cert(JSON.parse(serviceAccount)),
    databaseURL: `https://${projectId}-default-rtdb.asia-southeast1.firebasedatabase.app`,
  });
}

export function getDb() {
  initAdmin();
  return getFirestore();
}

export function getRtdb() {
  initAdmin();
  return getDatabase();
}

export function nowTimestamp() {
  const now = new Date();
  return {
    display: now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }).replace(/\//g, "/").replace(",", ""),
    unix: now.getTime(),
  };
}
