import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";
import { saveChangeLog } from "@/lib/changelog";
import { getOperatorId } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const operatorId = await getOperatorId();
  if (!operatorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { noticeId } = await req.json();
  if (!noticeId) {
    return NextResponse.json({ error: "noticeId required" }, { status: 400 });
  }

  const db = getDb();
  await db.collection("notices").doc(noticeId).delete();
  await saveChangeLog({
    operatorId,
    targetCollection: "notices",
    targetId: noticeId,
    changeType: "delete",
    changedFields: {},
  });

  const viewerUrl = process.env.VIEWER_REVALIDATE_URL;
  const viewerSecret = process.env.VIEWER_REVALIDATE_SECRET;
  if (viewerUrl && viewerSecret) {
    await fetch(viewerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: viewerSecret, paths: ["/notice", "/top"] }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
