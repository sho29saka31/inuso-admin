import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";
import { getOperatorId } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const operatorId = await getOperatorId();
  if (!operatorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);

  const db = getDb();
  const snap = await db.collection("changeLogs").orderBy("changedAt.unix", "desc").limit(limit).get();
  const logs = snap.docs.map((d) => d.data());

  return NextResponse.json({ logs });
}
