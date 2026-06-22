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

  const { noticeId, authorId, title, body, target, type } = await req.json();
  if (!noticeId || !authorId || !title || !body) {
    return NextResponse.json({ error: "noticeId, authorId, title, body required" }, { status: 400 });
  }

  const db = getDb();
  const fields = {
    authorId,
    title,
    body,
    target: target ?? "all",
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
