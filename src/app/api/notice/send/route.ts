import { NextRequest, NextResponse } from "next/server";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { saveChangeLog } from "@/lib/changelog";
import { getOperatorId, getAdminScope } from "@/lib/admin-auth";
import { isFullAccess, getScopeAuthorId } from "@/lib/admin-scope";
import { getMessaging } from "firebase-admin/messaging";
import { revalidateViewer } from "@/lib/revalidate";

export async function POST(req: NextRequest) {
  const operatorId = await getOperatorId();
  if (!operatorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scope = (await getAdminScope()) ?? operatorId;
  const { authorId, title, body, target, type } = await req.json();
  if (!title || !body) {
    return NextResponse.json({ error: "title, body required" }, { status: 400 });
  }

  const resolvedTarget = isFullAccess(scope) ? (target ?? "all") : "all";
  const resolvedAuthorId = isFullAccess(scope) ? (authorId ?? operatorId) : getScopeAuthorId(scope);

  const db = getDb();
  const now = nowTimestamp();
  const noticeId = `notice-${Date.now()}`;

  const data = {
    noticeId,
    authorId: resolvedAuthorId,
    title,
    body,
    target: resolvedTarget,
    type: type ?? "info",
    createdAt: now,
  };

  await db.collection("notices").doc(noticeId).set(data);
  await saveChangeLog({
    operatorId,
    targetCollection: "notices",
    targetId: noticeId,
    changeType: "create",
    changedFields: data,
  });

  try {
    const messaging = getMessaging();
    await messaging.send({
      topic: resolvedTarget,
      data: { noticeId, type: type ?? "info", title, body },
      webpush: { headers: { Urgency: "high" } },
    });
  } catch (err) {
    console.error("FCM send error:", err);
  }

  await revalidateViewer(["/notice", "/top"]);

  return NextResponse.json({ ok: true, noticeId });
}
