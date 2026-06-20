export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/firebase-admin";
import { getAdminScope } from "@/lib/admin-auth";
import { isFullAccess } from "@/lib/admin-scope";
import NoticeEditClient from "./NoticeEditClient";

async function getNotice(noticeId: string) {
  try {
    const db = getDb();
    const doc = await db.collection("notices").doc(noticeId).get();
    return doc.exists ? (doc.data() as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export default async function AdminNoticeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [notice, scope] = await Promise.all([getNotice(id), getAdminScope()]);
  if (!notice) notFound();

  const canEdit =
    isFullAccess(scope ?? "") || notice.authorId === scope;
  if (!canEdit) notFound();

  return <NoticeEditClient notice={notice} scope={scope ?? ""} />;
}
