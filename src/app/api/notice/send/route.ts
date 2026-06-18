import { NextRequest, NextResponse } from "next/server";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { saveChangeLog } from "@/lib/changelog";
import { getOperatorId } from "@/lib/admin-auth";
import { getMessaging } from "firebase-admin/messaging";

export async function POST(req: NextRequest) {
  const operatorId = await getOperatorId();
  if (!operatorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { authorId, title, body, target, isUrgent, sendPush } = await req.json();
  if (!authorId || !title || !body) {
    return NextResponse.json({ error: "authorId, title, body required" }, { status: 400 });
  }

  const db = getDb();
  const now = nowTimestamp();
  const noticeId = `notice-${Date.now()}`;

  const data = {
    noticeId,
    authorId,
    title,
    body,
    target: target ?? "all",
    isUrgent: Boolean(isUrgent),
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

  if (sendPush) {
    try {
      const messaging = getMessaging();
      await messaging.send({
        topic: target ?? "all",
        notification: { title, body },
        data: { noticeId, isUrgent: String(Boolean(isUrgent)) },
      });
    } catch (err) {
      console.error("FCM send error:", err);
    }
  }

  const viewerUrl = process.env.VIEWER_REVALIDATE_URL;
  const viewerSecret = process.env.VIEWER_REVALIDATE_SECRET;
  if (viewerUrl && viewerSecret) {
    await fetch(viewerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: viewerSecret, paths: ["/notice", "/top"] }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, noticeId });
}
