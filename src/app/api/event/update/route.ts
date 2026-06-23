import { NextRequest, NextResponse } from "next/server";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { saveChangeLog } from "@/lib/changelog";
import { getOperatorId, getAdminScope } from "@/lib/admin-auth";
import { isFullAccess } from "@/lib/admin-scope";
import { revalidateViewer } from "@/lib/revalidate";

export async function POST(req: NextRequest) {
  const operatorId = await getOperatorId();
  if (!operatorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scope = (await getAdminScope()) ?? operatorId;
  if (!isFullAccess(scope)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as Record<string, unknown>;
  const eventId = typeof body.eventId === "string" ? body.eventId : undefined;
  const startTime = body.startTime;
  const endTime = body.endTime;
  const location = body.location;
  const isDelayed = body.isDelayed;
  const delayMinutes = body.delayMinutes;
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

  await revalidateViewer(["/event"]);

  return NextResponse.json({ ok: true });
}
