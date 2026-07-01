import { NextRequest, NextResponse } from "next/server";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { getMessaging } from "firebase-admin/messaging";
import { safeCompare } from "@/lib/safe-compare";

const STALE_THRESHOLD_MS = 20 * 60 * 1000;
const CLASS_BOOTH_IDS = [
  "class1-1", "class1-2", "class1-3", "class1-4",
  "class2-1", "class2-2", "class2-3", "class2-4",
  "class3-1", "class3-2", "class3-3", "class3-4",
];

// Vercel Cron (5分間隔) から呼ばれる。同クラスロールの端末（FCM topic = boothId）に
// 更新途絶を通知する。同一の途絶継続中は再送しない（lastStaleAlertAt で判定）。
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !token || !safeCompare(token, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const now = Date.now();
  const alerted: string[] = [];

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
      alerted.push(boothId);
    } catch (err) {
      console.error(`stale alert send error (${boothId}):`, err);
    }
  }

  return NextResponse.json({ ok: true, alerted });
}
