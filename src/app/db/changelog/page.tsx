import { getDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const CHANGE_TYPE_LABEL: Record<string, string> = {
  create: "作成",
  update: "更新",
  delete: "削除",
};

const COLLECTION_LABEL: Record<string, string> = {
  booths: "ブース",
  events: "イベント",
  notices: "通知",
  digital: "パンフレット",
  config: "設定",
};

function formatDate(ts: { display?: string; unix?: number } | null | undefined): string {
  if (!ts) return "—";
  if (ts.display) return ts.display;
  if (ts.unix) {
    return new Date(ts.unix).toLocaleString("ja-JP", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  }
  return "—";
}

export default async function ChangelogPage() {
  const db = getDb();
  const snap = await db
    .collection("changeLogs")
    .orderBy("changedAt", "desc")
    .limit(100)
    .get();

  const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
    id: string;
    operatorId: string;
    targetCollection: string;
    targetId: string;
    changeType: string;
    changedFields: Record<string, unknown>;
    changedAt: { display?: string; unix?: number } | null;
  }>;

  return (
    <div>
      <h1 className="text-lg font-bold mb-4">変更ログ</h1>

      {logs.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">ログがありません</p>
      ) : (
        <div className="flex flex-col gap-3">
          {logs.map((log) => (
            <div key={log.id} className="border rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold text-white ${
                    log.changeType === "create"
                      ? "bg-green-500"
                      : log.changeType === "delete"
                      ? "bg-red-500"
                      : "bg-blue-500"
                  }`}
                >
                  {CHANGE_TYPE_LABEL[log.changeType] ?? log.changeType}
                </span>
                <span className="font-medium">
                  {COLLECTION_LABEL[log.targetCollection] ?? log.targetCollection}
                </span>
                <span className="text-gray-400 text-xs truncate flex-1">
                  ID: {log.targetId}
                </span>
              </div>
              <div className="text-xs text-gray-500 flex justify-between">
                <span>操作者: {log.operatorId || "—"}</span>
                <span>{formatDate(log.changedAt)}</span>
              </div>
              {log.changedFields && Object.keys(log.changedFields).length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-400 cursor-pointer">変更フィールド詳細</summary>
                  <pre className="mt-1 text-xs bg-gray-50 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(log.changedFields, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
