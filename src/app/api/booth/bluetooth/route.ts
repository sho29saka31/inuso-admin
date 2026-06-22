import { NextRequest, NextResponse } from "next/server";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { saveChangeLog } from "@/lib/changelog";

// C-3 ハイブリッド型混雑レベル算出
const deviceHistory: Map<string, number[]> = new Map();

function calcStatus(boothId: string, deviceCount: number): number {
  const history = deviceHistory.get(boothId) ?? [];
  history.push(deviceCount);
  if (history.length > 30) history.shift();
  deviceHistory.set(boothId, history);

  const baseline = history.length > 0 ? Math.max(...history) : 20;
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
  if (token !== process.env.BLUETOOTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { boothId, deviceCount, macAddresses, operatorId } = body;

  if (!boothId || deviceCount === undefined) {
    return NextResponse.json({ error: "boothId and deviceCount required" }, { status: 400 });
  }

  const db = getDb();

  // ブースの存在確認
  const boothDoc = await db.collection("booths").doc(boothId).get();
  if (!boothDoc.exists) {
    return NextResponse.json({ error: "booth not found", boothId }, { status: 400 });
  }

  // 手動モードのブースはBluetoothによる自動更新をスキップ
  if (boothDoc.data()?.isManual) {
    return NextResponse.json({ ok: true, skipped: true, reason: "manual mode" });
  }

  const status = calcStatus(boothId, Number(deviceCount));

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

  return NextResponse.json({ ok: true, status });
}
