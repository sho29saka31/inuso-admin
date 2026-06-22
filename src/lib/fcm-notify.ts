import { getApps, initializeApp, cert, getApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getDb } from "./firebase-admin";

function getAdminApp() {
  if (getApps().length > 0) return getApp();
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccount) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not set");
  return initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
}

export async function sendAdminNotification(scope: string, title: string, body: string) {
  const db = getDb();
  const tokenDoc = await db.collection("adminFcmTokens").doc(scope).get();
  if (!tokenDoc.exists) return { sent: false, reason: "no token" };

  const token = tokenDoc.data()?.token as string | undefined;
  if (!token) return { sent: false, reason: "no token" };

  try {
    const app = getAdminApp();
    await getMessaging(app).send({
      token,
      data: { title, body },
      android: { priority: "high" },
      apns: { payload: { aps: { contentAvailable: true } } },
    });
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: String(e) };
  }
}
