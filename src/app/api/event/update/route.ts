import { NextRequest, NextResponse } from "next/server";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { saveChangeLog } from "@/lib/changelog";
import { getOperatorId } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const operatorId = await getOperatorId();
  if (!operatorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId, startTime, endTime, location, isDelayed, delayMinutes } = await req.json();
  if (!eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }

  const db = getDb();
  const now = nowTimestamp();
  const fields: Record<string, unknown> = {
    isDelayed: Boolean(isDelayed),
    delayMinutes: Number(delayMinutes ?? 0),
    updatedAt: now,
  };
  if (startTime !== undefined) fields.startTime = startTime;
  if (endTime !== undefined) fields.endTime = endTime;
  if (location !== undefined) fields.location = location;

  await db.collection("events").doc(eventId).update(fields);
  await saveChangeLog({
    operatorId,
    targetCollection: "events",
    targetId: eventId,
    changeType: "update",
    changedFields: fields,
  });

  const viewerUrl = process.env.VIEWER_REVALIDATE_URL;
  const viewerSecret = process.env.VIEWER_REVALIDATE_SECRET;
  if (viewerUrl && viewerSecret) {
    await fetch(viewerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: viewerSecret, paths: ["/event"] }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
