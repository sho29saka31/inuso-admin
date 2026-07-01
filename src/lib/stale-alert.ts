import { getDb, nowTimestamp } from "./firebase-admin";
import { getMessaging } from "firebase-admin/messaging";

const STALE_THRESHOLD_MS = 20 * 60 * 1000;
const CHECK_THROTTLE_MS = 4 * 60 * 1000;
const CLASS_BOOTH_IDS = [
  "class1-1", "class1-2", "class1-3", "class1-4",
  "class2-1", "class2-2", "class2-3", "class2-4",
  "class3-1", "class3-2", "class3-3", "class3-4",
];

// Vercel Hobbyプランは高頻度cronが使えないため、/api/booth/bluetooth の
// リクエスト（各ブースからおよそ60秒間隔で届く）に便乗して定期実行する。
// config/staleCheckLock で直近実行時刻を管理し、実行を間引く。
export async function checkAndSendStaleAlerts(): Promise<void> {
  const db = getDb();
  const now = Date.now();

  const lockRef = db.collection("config").doc("staleCheckLock");
  const lockDoc = await lockRef.get();
  const lastRunUnix = lockDoc.data()?.lastRunUnix as number | undefined;
  if (typeof lastRunUnix === "number" && now - lastRunUnix < CHECK_THROTTLE_MS) return;
  await lockRef.set({ lastRunUnix: now }, { merge: true });

  for (const boothId of CLASS_BOOTH_IDS) {
    const doc = await db.collection("booths").doc(boothId).get();
    if (!doc.exists) continue;
    const data = doc.data()!;

    if (data.isManual) continue;
    if (data.status === 0) continue;

    const updatedUnix = data.updatedAt?.unix as number | undefined;
    if (typeof updatedUnix !== "number") continue;
    if (now - updatedUnix <= STALE_THRESHOLD_MS) continue;

    const lastAlertUnix = data.lastStaleAlertAt?.unix as number | undefined;
    if (typeof lastAlertUnix === "number" && lastAlertUnix >= updatedUnix) continue;

    try {
      await getMessaging().send({
        topic: boothId,
        data: {
          type: "stale-alert",
          title: "更新が停止しています",
          body: "このブースの混雑状況が20分以上更新されていません。",
        },
        webpush: { headers: { Urgency: "high" } },
      });
      await doc.ref.update({ lastStaleAlertAt: nowTimestamp() });
    } catch (err) {
      console.error(`stale alert send error (${boothId}):`, err);
    }
  }
}
