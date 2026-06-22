import { NextRequest, NextResponse } from "next/server";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { saveChangeLog } from "@/lib/changelog";
import { getOperatorId } from "@/lib/admin-auth";
import { getMessaging } from "firebase-admin/messaging";
import { revalidateViewer } from "@/lib/revalidate";

export async function POST(req: NextRequest) {
  const operatorId = await getOperatorId();
  if (!operatorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { authorId, title, body, target, type } = await req.json();
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
      topic: target ?? "all",
      data: { noticeId, type: type ?? "info", title, body },
      webpush: { headers: { Urgency: "high" } },
    });
  } catch (err) {
    console.error("FCM send error:", err);
  }

  await revalidateViewer(["/notice", "/top"]);

  return NextResponse.json({ ok: true, noticeId });
}
