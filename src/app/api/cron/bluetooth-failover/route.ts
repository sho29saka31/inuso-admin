import { NextRequest, NextResponse } from "next/server";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { sendAdminNotification } from "@/lib/fcm-notify";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const FAILOVER_THRESHOLD_MS = 3 * 60 * 1000; // 3分間データなし→手動切替
const REMINDER_INTERVAL_MS = 5 * 60 * 1000;  // 5分ごとにリマインド

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const now = Date.now();
  const snap = await db.collection("booths").get();

  const results: Record<string, string> = {};

  for (const doc of snap.docs) {
    const d = doc.data();
    const boothId = doc.id;
    const scope: string = d.scope ?? boothId;
    const isManual: boolean = d.isManual ?? false;
    const isManualByFailover: boolean = d.isManualByFailover ?? false;
    const lastBluetoothUnix: number = d.lastBluetoothAt?.unix ?? 0;
    const lastReminderUnix: number = d.lastManualReminderAt?.unix ?? 0;

    if (isManual && !isManualByFailover) {
      // 人間が手動にした場合は何もしない
      results[boothId] = "manual_by_human";
      continue;
    }

    if (!isManual) {
      // Bluetoothデータ未受信チェック
      if (lastBluetoothUnix === 0) {
        results[boothId] = "no_data_yet";
        continue;
      }
      const elapsed = now - lastBluetoothUnix;
      if (elapsed >= FAILOVER_THRESHOLD_MS) {
        // 手動モードへ切替
        await db.collection("booths").doc(boothId).update({
          isManual: true,
          isManualByFailover: true,
          failoverAt: nowTimestamp(),
          lastManualReminderAt: nowTimestamp(),
        });
        await sendAdminNotification(
          scope,
          "混雑情報 手動モードに切替",
          "Bluetoothデータの受信が途絶えたため、手動モードに切り替わりました。状況を確認してください。"
        );
        results[boothId] = "switched_to_manual";
      } else {
        results[boothId] = "ok";
      }
      continue;
    }

    // 手動モード（フェイルオーバー起因）: 5分ごとにリマインド
    if (isManualByFailover) {
      if (now - lastReminderUnix >= REMINDER_INTERVAL_MS) {
        await db.collection("booths").doc(boothId).update({
          lastManualReminderAt: nowTimestamp(),
        });
        await sendAdminNotification(
          scope,
          "手動モード稼働中",
          "現在手動モードで動作中です。5分ごとに混雑状況を更新してください。"
        );
        results[boothId] = "reminder_sent";
      } else {
        results[boothId] = "manual_by_failover_waiting";
      }
    }
  }

  return NextResponse.json({ ok: true, results });
}
