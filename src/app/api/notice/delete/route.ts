import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";
import { saveChangeLog } from "@/lib/changelog";
import { getOperatorId, getAdminScope } from "@/lib/admin-auth";
import { isFullAccess, getScopeAuthorId } from "@/lib/admin-scope";
import { revalidateViewer } from "@/lib/revalidate";

export async function POST(req: NextRequest) {
  const operatorId = await getOperatorId();
  if (!operatorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { noticeId } = await req.json();
  if (!noticeId) {
    return NextResponse.json({ error: "noticeId required" }, { status: 400 });
  }

  const scope = (await getAdminScope()) ?? operatorId;
  const db = getDb();

  if (!isFullAccess(scope)) {
    const doc = await db.collection("notices").doc(noticeId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    if (doc.data()?.authorId !== getScopeAuthorId(scope)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await db.collection("notices").doc(noticeId).delete();
  await saveChangeLog({
    operatorId,
    targetCollection: "notices",
    targetId: noticeId,
    changeType: "delete",
    changedFields: {},
  });

  await revalidateViewer(["/notice", "/top"]);

  return NextResponse.json({ ok: true });
}
