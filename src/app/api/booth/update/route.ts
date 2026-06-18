import { NextRequest, NextResponse } from "next/server";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { saveChangeLog } from "@/lib/changelog";
import { getOperatorId } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const operatorId = await getOperatorId();
  if (!operatorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boothId, status, waitCount } = await req.json();
  if (!boothId) {
    return NextResponse.json({ error: "boothId required" }, { status: 400 });
  }

  const db = getDb();
  const now = nowTimestamp();
  const fields = { status: Number(status), waitCount: Number(waitCount), updatedAt: now };

  await db.collection("booths").doc(boothId).update(fields);
  await saveChangeLog({
    operatorId,
    targetCollection: "booths",
    targetId: boothId,
    changeType: "update",
    changedFields: fields,
  });

  // Trigger viewer revalidation
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
