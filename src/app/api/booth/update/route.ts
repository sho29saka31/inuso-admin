import { NextRequest, NextResponse } from "next/server";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { saveChangeLog } from "@/lib/changelog";
import { getOperatorId } from "@/lib/admin-auth";
import { revalidateViewer } from "@/lib/revalidate";

export async function POST(req: NextRequest) {
  const operatorId = await getOperatorId();
  if (!operatorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as Record<string, unknown>;
  const boothId = typeof body.boothId === "string" ? body.boothId : undefined;
  const status = body.status;
  const waitCount = body.waitCount;
  const isManual = body.isManual;
  const products = body.products;
  if (!boothId) {
    return NextResponse.json({ error: "boothId required" }, { status: 400 });
  }

  const db = getDb();
  const now = nowTimestamp();
  const fields: Record<string, unknown> = {
    status: Number(status),
    waitCount: Number(waitCount),
    updatedAt: now,
  };
  if (isManual !== undefined) fields.isManual = Boolean(isManual);
  if (products !== undefined) fields.products = products;

  await db.collection("booths").doc(boothId).update(fields);
  await saveChangeLog({
    operatorId,
    targetCollection: "booths",
    targetId: boothId,
    changeType: "update",
    changedFields: fields,
  });

  await revalidateViewer(["/busy", "/booth"]);

  return NextResponse.json({ ok: true });
}
