import { NextRequest, NextResponse } from "next/server";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { saveChangeLog } from "@/lib/changelog";
import { getOperatorId, getAdminScope } from "@/lib/admin-auth";
import { isFullAccess } from "@/lib/admin-scope";

const SCOPE_TO_BOOTH_ID: Record<string, string> = {
  "1-1": "class1-1", "1-2": "class1-2", "1-3": "class1-3", "1-4": "class1-4",
  "2-1": "class2-1", "2-2": "class2-2", "2-3": "class2-3", "2-4": "class2-4",
  "3-1": "class3-1", "3-2": "class3-2", "3-3": "class3-3", "3-4": "class3-4",
  "eスポーツ部": "club-game",
  "美術部": "club-art",
  "有志発表": "pe-gym",
  "保健委員会": "health",
};

function isBoothAllowed(boothData: Record<string, unknown>, boothId: string, scope: string): boolean {
  if (scope === "eat-car") return (boothData.type as string) === "car";
  if (scope === "pta-bazaar") return (boothData.type as string) === "pta";
  const mappedId = SCOPE_TO_BOOTH_ID[scope];
  if (mappedId) return mappedId === boothId;
  return (boothData.scope as string | undefined) === scope;
}
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

  const scope = (await getAdminScope()) ?? operatorId;
  const db = getDb();

  if (!isFullAccess(scope)) {
    const boothDoc = await db.collection("booths").doc(boothId).get();
    if (!boothDoc.exists) {
      return NextResponse.json({ error: "booth not found" }, { status: 404 });
    }
    if (!isBoothAllowed(boothDoc.data() as Record<string, unknown>, boothId, scope)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
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
