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
function calcStatus(
  boothId: string,
  deviceCount: number,
  baselineMax?: number
): { status: number; heatScore: number } {
  const history = deviceHistory.get(boothId) ?? [];
  history.push(deviceCount);
  if (history.length > 30) history.shift();
  deviceHistory.set(boothId, history);

  const baseline = baselineMax ?? (history.length > 0 ? Math.max(...history) : 20);
  if (baseline === 0) return { status: 1, heatScore: 0 };

  const ratio = (deviceCount / baseline) * 100;
  // heatScore: 連続ヒートマップ用の0-100正規化スコア（ratioをそのままclampするだけ）
  const heatScore = Math.max(0, Math.min(100, Math.round(ratio)));

  let status: number;
  if (ratio <= 15) status = 1;
  else if (ratio <= 35) status = 2;
  else if (ratio <= 55) status = 3;
  else if (ratio <= 75) status = 4;
  else status = 5;

  return { status, heatScore };
}

// BLUETOOTH_SECRET が {boothId: token} のJSONマップならブースごとのトークンを、
// 単一文字列なら全ブース共通トークン（後方互換）を、照合対象として返す。
function resolveExpectedToken(boothId: string | undefined): string | null {
  const raw = process.env.BLUETOOTH_SECRET;
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    try {
      const map = JSON.parse(trimmed) as Record<string, unknown>;
      const t = boothId ? map[boothId] : undefined;
      return typeof t === "string" && t.length > 0 ? t : null;
    } catch {
      // JSONとして壊れている場合は単一トークンとして扱う
      return raw;
    }
  }
  return raw;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const boothId = typeof body.boothId === "string" ? body.boothId : undefined;
  const deviceCount = typeof body.deviceCount === "number" ? body.deviceCount : undefined;
  const operatorId = typeof body.operatorId === "string" ? body.operatorId : undefined;

  // 認証（per-boothトークン対応）: boothId に対応するトークンと Bearer を照合
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const expected = resolveExpectedToken(boothId);
  if (!expected || !token || !safeCompare(token, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  const { status, heatScore } = calcStatus(boothId, Number(deviceCount), baselineMax);

  const now = nowTimestamp();
  const fields: Record<string, unknown> = {
    status,
    heatScore,
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
    changedFields: { status, heatScore, deviceCount: Number(deviceCount) },
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

  return NextResponse.json({ ok: true, status, heatScore });
}
