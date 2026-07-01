import { NextRequest, NextResponse } from "next/server";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { saveChangeLog } from "@/lib/changelog";
import { sendAdminNotification } from "@/lib/fcm-notify";
import { safeCompare } from "@/lib/safe-compare";
import { checkAndSendStaleAlerts } from "@/lib/stale-alert";

// C-3 ハイブリッド型混雑レベル算出
const deviceHistory: Map<string, number[]> = new Map();

// baselineMax: 朝テストで計測した満員時のデバイス数（Firestoreから取得）
// 未設定の場合はrolling windowの最大値をbaselineとして使用
function calcStatus(boothId: string, deviceCount: number, baselineMax?: number): number {
  const history = deviceHistory.get(boothId) ?? [];
  history.push(deviceCount);
  if (history.length > 30) history.shift();
  deviceHistory.set(boothId, history);

  const baseline = baselineMax ?? (history.length > 0 ? Math.max(...history) : 20);
  if (baseline === 0) return 1;

  const ratio = (deviceCount / baseline) * 100;
  if (ratio <= 15) return 1;
  if (ratio <= 35) return 2;
  if (ratio <= 55) return 3;
  if (ratio <= 75) return 4;
  return 5;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const btSecret = process.env.BLUETOOTH_SECRET;
  if (!btSecret || !token || !safeCompare(token, btSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as Record<string, unknown>;
  const boothId = typeof body.boothId === "string" ? body.boothId : undefined;
  const deviceCount = typeof body.deviceCount === "number" ? body.deviceCount : undefined;
  const operatorId = typeof body.operatorId === "string" ? body.operatorId : undefined;

  if (!boothId || deviceCount === undefined) {
    return NextResponse.json({ error: "boothId and deviceCount required" }, { status: 400 });
  }

  const db = getDb();

  // ブースの存在確認
  const boothDoc = await db.collection("booths").doc(boothId).get();
  if (!boothDoc.exists) {
    return NextResponse.json({ error: "booth not found", boothId }, { status: 400 });
  }

  const boothData = boothDoc.data()!;

  // フェイルオーバーで手動になったブースはBluetoothが復旧したら自動に戻す
  if (boothData.isManualByFailover) {
    const scope: string = boothData.scope ?? boothId;
    await db.collection("booths").doc(boothId).update({
      isManual: false,
      isManualByFailover: false,
      failoverAt: null,
      lastManualReminderAt: null,
    });
    await sendAdminNotification(
      scope,
      "Bluetooth復旧",
      "Bluetoothデータの受信が再開されました。自動更新モードに戻りました。"
    );
  }

  // 人間が手動にしたブースはスキップ
  if (boothData.isManual && !boothData.isManualByFailover) {
    return NextResponse.json({ ok: true, skipped: true, reason: "manual mode" });
  }

  const baselineMax: number | undefined =
    typeof boothData.baselineMax === "number" ? boothData.baselineMax : undefined;
  const status = calcStatus(boothId, Number(deviceCount), baselineMax);

  const now = nowTimestamp();
  const fields: Record<string, unknown> = {
    status,
    deviceCount: Number(deviceCount),
    updatedAt: now,
    lastBluetoothAt: now,
  };

  await db.collection("booths").doc(boothId).update(fields);
  await saveChangeLog({
    operatorId: operatorId ?? `bt-${boothId}`,
    targetCollection: "booths",
    targetId: boothId,
    changeType: "update",
    changedFields: { status, deviceCount: Number(deviceCount) },
  });

  const viewerUrl = process.env.VIEWER_REVALIDATE_URL;
  const viewerSecret = process.env.VIEWER_REVALIDATE_SECRET;
  if (viewerUrl && viewerSecret) {
    await fetch(viewerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: viewerSecret, paths: ["/busy", "/booth"] }),
    }).catch(() => {});
  }

  await checkAndSendStaleAlerts().catch((err) => console.error("stale alert check error:", err));

  return NextResponse.json({ ok: true, status });
}
