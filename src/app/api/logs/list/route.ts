import { NextRequest, NextResponse } from "next/server";
import { getRtdb } from "@/lib/firebase-admin";
import { getOperatorId, getAdminScope } from "@/lib/admin-auth";
import { isFullAccess } from "@/lib/admin-scope";

export async function GET(req: NextRequest) {
  const operatorId = await getOperatorId();
  if (!operatorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
  const scope = (await getAdminScope()) ?? operatorId;

  const db = getRtdb();
  const snap = await db.ref("changeLogs").orderByChild("changedAt/unix").limitToLast(limit).once("value");
  const raw = snap.val() as Record<string, Record<string, unknown>> | null;
  if (!raw) return NextResponse.json({ logs: [] });

  const allLogs = Object.values(raw).flatMap((target) => Object.values(target));
  allLogs.sort((a, b) => {
    const au = (a as { changedAt?: { unix?: number } }).changedAt?.unix ?? 0;
    const bu = (b as { changedAt?: { unix?: number } }).changedAt?.unix ?? 0;
    return bu - au;
  });

  const logs = isFullAccess(scope)
    ? allLogs.slice(0, limit)
    : allLogs.filter((log) => (log as { operatorId?: string }).operatorId === operatorId).slice(0, limit);

  return NextResponse.json({ logs });
}
