import { getApps, initializeApp, cert, getApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getRtdb } from "./firebase-admin";

function getAdminApp() {
  if (getApps().length > 0) return getApp();
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccount) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not set");
  return initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
}

export async function sendAdminNotification(scope: string, title: string, body: string) {
  const db = getRtdb();
  const snapshot = await db.ref(`adminFcmTokens/${scope}/token`).get();
  const token = snapshot.val() as string | null;
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
