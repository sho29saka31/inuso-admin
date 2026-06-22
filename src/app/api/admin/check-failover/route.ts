import { NextResponse } from "next/server";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { getAdminScope } from "@/lib/admin-auth";
import { sendAdminNotification } from "@/lib/fcm-notify";

export const dynamic = "force-dynamic";

const FAILOVER_THRESHOLD_MS = 3 * 60 * 1000;
const REMINDER_INTERVAL_MS = 5 * 60 * 1000;

export async function POST() {
  const scope = await getAdminScope();
  if (!scope) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const now = Date.now();

  // scopeに対応するブースを検索
  const snap = await db.collection("booths").where("scope", "==", scope).limit(1).get();
  if (snap.empty) {
    return NextResponse.json({ ok: true, result: "no_booth" });
  }

  const doc = snap.docs[0];
  const d = doc.data();
  const boothId = doc.id;
  const isManual: boolean = d.isManual ?? false;
  const isManualByFailover: boolean = d.isManualByFailover ?? false;
  const lastBluetoothUnix: number = d.lastBluetoothAt?.unix ?? 0;
  const lastReminderUnix: number = d.lastManualReminderAt?.unix ?? 0;

  if (isManual && !isManualByFailover) {
    return NextResponse.json({ ok: true, result: "manual_by_human" });
  }

  if (!isManual) {
    if (lastBluetoothUnix === 0) {
      return NextResponse.json({ ok: true, result: "no_data_yet" });
    }
    if (now - lastBluetoothUnix >= FAILOVER_THRESHOLD_MS) {
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
      return NextResponse.json({ ok: true, result: "switched_to_manual" });
    }
    return NextResponse.json({ ok: true, result: "ok" });
  }

  if (isManualByFailover && now - lastReminderUnix >= REMINDER_INTERVAL_MS) {
    await db.collection("booths").doc(boothId).update({
      lastManualReminderAt: nowTimestamp(),
    });
    await sendAdminNotification(
      scope,
      "手動モード稼働中",
      "現在手動モードで動作中です。5分ごとに混雑状況を更新してください。"
    );
    return NextResponse.json({ ok: true, result: "reminder_sent" });
  }

  return NextResponse.json({ ok: true, result: "manual_by_failover_waiting" });
}
