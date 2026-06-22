import { NextRequest, NextResponse } from "next/server";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { getAdminScope } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const scope = await getAdminScope();
  if (!scope) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as Record<string, unknown>;
  const token = typeof body.token === "string" ? body.token : undefined;
  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const db = getDb();
  await db.collection("adminFcmTokens").doc(scope).set({
    scope,
    token,
    updatedAt: nowTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
