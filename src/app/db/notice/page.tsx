export const dynamic = "force-dynamic";
import Link from "next/link";
import { getDb } from "@/lib/firebase-admin";
import { deleteNotice } from "./actions";
import { DeleteButton } from "./DeleteButton";

async function getNotices() {
  try {
    const db = getDb();
    const snap = await db.collection("notices").orderBy("createdAt.unix", "desc").get();
    return snap.docs.map((d) => d.data());
  } catch {
    return null;
  }
}

export default async function NoticeListPage() {
  const notices = await getNotices();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">通知一覧</h1>
        <Link href="/db/notice/new" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium">
          + 新規作成
        </Link>
      </div>

      {notices === null ? (
        <p className="text-danger text-sm">Firebase未設定。</p>
      ) : notices.length === 0 ? (
        <p className="text-text-sub text-sm">通知がありません。</p>
      ) : (
        <div className="flex flex-col gap-2">
          {notices.map((n) => (
            <div key={n.noticeId} className="bg-surface rounded-lg border p-4 flex items-start justify-between gap-4">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  {n.isUrgent && <span className="text-xs bg-danger text-white px-1.5 py-0.5 rounded">緊急</span>}
                  <span className="font-medium text-sm">{n.title}</span>
                </div>
                <span className="text-xs text-text-sub">{n.target} / {n.authorId}</span>
                <span className="text-xs text-text-sub">{n.createdAt?.display}</span>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link href={`/db/notice/${n.noticeId}`} className="text-xs px-3 py-1.5 rounded border border-primary text-primary">
                  編集
                </Link>
                <DeleteButton noticeId={n.noticeId} title={n.title} action={deleteNotice} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
