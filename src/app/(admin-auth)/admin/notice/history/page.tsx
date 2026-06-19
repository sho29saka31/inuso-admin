export const dynamic = "force-dynamic";
import { getDb } from "@/lib/firebase-admin";

const TYPE_LABELS: Record<string, string> = {
  urgent: "緊急",
  info: "お知らせ",
  warning: "注意",
  other: "その他",
};
const TYPE_COLORS: Record<string, string> = {
  urgent: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  warning: "bg-yellow-100 text-yellow-700",
  other: "bg-gray-100 text-gray-600",
};
const TARGET_LABELS: Record<string, string> = {
  all: "全ユーザー",
  guest: "ゲスト",
  edu: "生徒全体",
  prof: "先生全体",
  "1nen": "1年全体",
  "2nen": "2年全体",
  "3nen": "3年全体",
};

async function getNotices() {
  try {
    const db = getDb();
    const snap = await db
      .collection("notices")
      .orderBy("createdAt.unix", "desc")
      .limit(50)
      .get();
    return snap.docs.map((d) => d.data());
  } catch {
    return null;
  }
}

export default async function AdminNoticeHistoryPage() {
  const notices = await getNotices();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">通知履歴</h1>

      {notices === null ? (
        <p className="text-danger text-sm">Firebase未設定。</p>
      ) : notices.length === 0 ? (
        <p className="text-text-sub text-sm">送信済み通知がありません。</p>
      ) : (
        <div className="flex flex-col gap-2">
          {notices.map((n) => (
            <div key={n.noticeId} className="bg-white rounded-xl border p-3 flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    TYPE_COLORS[n.type] ?? TYPE_COLORS.other
                  }`}
                >
                  {TYPE_LABELS[n.type] ?? n.type}
                </span>
                <span className="text-sm font-medium truncate">{n.title}</span>
              </div>
              <p className="text-xs text-text-sub line-clamp-2">{n.body}</p>
              <div className="flex items-center gap-2 flex-wrap text-xs text-text-sub mt-0.5">
                <span>発信: {n.authorId}</span>
                <span>対象: {TARGET_LABELS[n.target] ?? n.target}</span>
                <span className="ml-auto">{n.createdAt?.display ?? ""}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
