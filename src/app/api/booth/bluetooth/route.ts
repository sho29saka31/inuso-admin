import { NextRequest, NextResponse } from "next/server";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { saveChangeLog } from "@/lib/changelog";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-secret");
  if (secret !== process.env.BLUETOOTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boothId, status, waitCount } = await req.json();
  if (!boothId) {
    return NextResponse.json({ error: "boothId required" }, { status: 400 });
  }

  const db = getDb();
  const now = nowTimestamp();
  const fields: Record<string, unknown> = { updatedAt: now };
  if (status !== undefined) fields.status = Number(status);
  if (waitCount !== undefined) fields.waitCount = Number(waitCount);

  await db.collection("booths").doc(boothId).update(fields);
  await saveChangeLog({
    operatorId: "bluetooth-sensor",
    targetCollection: "booths",
    targetId: boothId,
    changeType: "update",
    changedFields: fields,
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

  return NextResponse.json({ ok: true });
}
