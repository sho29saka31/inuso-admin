export const dynamic = "force-dynamic";
import { getDb } from "@/lib/firebase-admin";

const TYPE_LABELS: Record<string, string> = { create: "作成", update: "更新", delete: "削除" };
const TYPE_COLORS: Record<string, string> = {
  create: "bg-green-100 text-green-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
};
const COLLECTION_LABELS: Record<string, string> = {
  booths: "ブース",
  events: "イベント",
  notices: "通知",
  config: "設定",
};

async function getLogs() {
  try {
    const db = getDb();
    const snap = await db.collection("changeLogs").orderBy("changedAt.unix", "desc").limit(100).get();
    return snap.docs.map((d) => d.data());
  } catch {
    return null;
  }
}

export default async function AdminLogsPage() {
  const logs = await getLogs();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">変更ログ</h1>

      {logs === null ? (
        <p className="text-danger text-sm">Firebase未設定。</p>
      ) : logs.length === 0 ? (
        <p className="text-text-sub text-sm">ログがありません。</p>
      ) : (
        <div className="flex flex-col gap-2">
          {logs.map((log) => (
            <div key={log.logId} className="bg-white rounded-xl border p-3 flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    TYPE_COLORS[log.changeType] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {TYPE_LABELS[log.changeType] ?? log.changeType}
                </span>
                <span className="text-xs font-medium">
                  {COLLECTION_LABELS[log.targetCollection] ?? log.targetCollection}
                </span>
                <span className="text-xs text-text-sub truncate max-w-[120px]">{log.targetId}</span>
                <span className="text-xs text-text-sub ml-auto">{log.changedAt?.display}</span>
              </div>
              <p className="text-xs text-text-sub">担当: {log.operatorId}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
