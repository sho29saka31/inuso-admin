"use server";

import { redirect } from "next/navigation";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { saveChangeLog } from "@/lib/changelog";

async function revalidateViewer(paths: string[]) {
  const viewerUrl = process.env.VIEWER_REVALIDATE_URL;
  const viewerSecret = process.env.VIEWER_REVALIDATE_SECRET;
  if (viewerUrl && viewerSecret) {
    await fetch(viewerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: viewerSecret, paths }),
    }).catch(() => {});
  }
}

export async function createNotice(formData: FormData) {
  const db = getDb();
  const now = nowTimestamp();
  const noticeId = `notice-${Date.now()}`;
  const data = {
    noticeId,
    authorId: (formData.get("authorId") as string) || "db-admin",
    title: formData.get("title") as string,
    body: formData.get("body") as string,
    target: formData.get("target") as string,
    type: (formData.get("type") as string) || "info",
    createdAt: now,
    updatedAt: now,
  };

  await db.collection("notices").doc(noticeId).set(data);
  await saveChangeLog({
    operatorId: data.authorId,
    targetCollection: "notices",
    targetId: noticeId,
    changeType: "create",
    changedFields: { created: data },
  });

  await revalidateViewer(["/notice", "/top"]);
  redirect("/db/notice");
}

export async function updateNotice(noticeId: string, formData: FormData) {
  const db = getDb();
  const now = nowTimestamp();
  const fields = {
    title: formData.get("title") as string,
    body: formData.get("body") as string,
    target: formData.get("target") as string,
    type: (formData.get("type") as string) || "info",
    updatedAt: now,
  };

  await db.collection("notices").doc(noticeId).update(fields);
  await saveChangeLog({
    operatorId: "db-admin",
    targetCollection: "notices",
    targetId: noticeId,
    changeType: "update",
    changedFields: fields,
  });

  await revalidateViewer(["/notice", "/top"]);
  redirect("/db/notice");
}

export async function deleteNotice(noticeId: string) {
  const db = getDb();
  await db.collection("notices").doc(noticeId).delete();
  await saveChangeLog({
    operatorId: "db-admin",
    targetCollection: "notices",
    targetId: noticeId,
    changeType: "delete",
    changedFields: {},
  });
  await revalidateViewer(["/notice", "/top"]);
  redirect("/db/notice");
}
