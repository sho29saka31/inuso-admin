export const dynamic = "force-dynamic";
import { getDb } from "@/lib/firebase-admin";
import { getAdminScope } from "@/lib/admin-auth";
import NoticeHistoryClient, { type Notice } from "./NoticeHistoryClient";

async function getNotices() {
  try {
    const db = getDb();
    const snap = await db
      .collection("notices")
      .orderBy("createdAt.unix", "desc")
      .limit(50)
      .get();
    return snap.docs.map((d) => d.data() as Notice);
  } catch {
    return null;
  }
}

export default async function AdminNoticeHistoryPage() {
  const [notices, scope] = await Promise.all([getNotices(), getAdminScope()]);
  return <NoticeHistoryClient notices={notices} scope={scope ?? ""} />;
}
