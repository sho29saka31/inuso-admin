import { NextRequest, NextResponse } from "next/server";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { saveChangeLog } from "@/lib/changelog";
import { getOperatorId, getAdminScope } from "@/lib/admin-auth";
import { isFullAccess, getScopeAuthorId } from "@/lib/admin-scope";
import { revalidateViewer } from "@/lib/revalidate";

export async function POST(req: NextRequest) {
  const operatorId = await getOperatorId();
  if (!operatorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scope = (await getAdminScope()) ?? operatorId;
  const { noticeId, authorId, title, body, target, type } = await req.json();
  if (!noticeId || !title || !body) {
    return NextResponse.json({ error: "noticeId, title, body required" }, { status: 400 });
  }

  const resolvedTarget = isFullAccess(scope) ? (target ?? "all") : "all";
  const resolvedAuthorId = isFullAccess(scope) ? (authorId ?? operatorId) : getScopeAuthorId(scope);

  const db = getDb();
  const fields = {
    authorId: resolvedAuthorId,
    title,
    body,
    target: resolvedTarget,
    type: type ?? "info",
    updatedAt: nowTimestamp(),
  };

  await db.collection("notices").doc(noticeId).update(fields);
  await saveChangeLog({
    operatorId,
    targetCollection: "notices",
    targetId: noticeId,
    changeType: "update",
    changedFields: fields,
  });

  await revalidateViewer(["/notice", "/top"]);

  return NextResponse.json({ ok: true });
}
