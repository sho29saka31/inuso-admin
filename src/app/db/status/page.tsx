"use client";

import { useEffect, useState, useCallback } from "react";

interface BoothStatus {
  boothId: string;
  name: string;
  mode: string;
  updatedAtDisplay: string;
  elapsedMinutes: number;
  state: "ok" | "warn" | "alert";
}

interface StatusData {
  serverTime: string;
  deploy: { sha: string | null; message: string | null };
  firestore: { ok: boolean; config?: { enabled: boolean | null; scanIntervalSeconds: number | null; staleness: { warnMinutes: number; alertMinutes: number } }; error?: string };
  booths: BoothStatus[] | null;
  boothsError: string | null;
  boothSummary: { ok: number; warn: number; alert: number } | null;
  warnMinutes: number;
  alertMinutes: number;
  notice: { title: string; createdAt: string; isUrgent: boolean } | null;
  noticeError: string | null;
  sentry: {
    viewer: { issues1h: number | null; issues24h: number | null };
    admin: { issues1h: number | null; issues24h: number | null };
  };
}

function StateBadge({ state }: { state: "ok" | "warn" | "alert" }) {
  if (state === "ok") return <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700">🟢 正常</span>;
  if (state === "warn") return <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-700">🟡 警告</span>;
  return <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">🔴 異常</span>;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <h2 className="text-sm font-bold text-text-main mb-3">{title}</h2>
      {children}
    </div>
  );
}

function IssueCount({ value }: { value: number | null }) {
  if (value === null) return <span className="text-text-sub text-sm">取得できません</span>;
  return (
    <span className={`text-sm font-bold ${value > 0 ? "text-danger" : "text-success"}`}>
      {value} 件
    </span>
  );
}

export default function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastFetched(new Date().toLocaleTimeString("ja-JP"));
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 30000);
    return () => clearInterval(id);
  }, [fetch_]);

  if (loading) {
    return (
      <div className="py-16 text-center text-text-sub text-sm">読み込み中...</div>
    );
  }

  if (error && !data) {
    return (
      <div className="py-16 text-center text-danger text-sm">
        データ取得エラー: {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">システムステータス</h1>
        <div className="text-xs text-text-sub text-right">
          <p>サーバー時刻: {data.serverTime}</p>
          <p>最終更新: {lastFetched}（30秒毎に自動更新）</p>
        </div>
      </div>

      {/* デプロイ情報 */}
      <SectionCard title="デプロイ情報">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-text-sub">コミット</dt>
          <dd className="font-mono text-xs truncate">{data.deploy.sha ? data.deploy.sha.slice(0, 8) : "—"}</dd>
          <dt className="text-text-sub">メッセージ</dt>
          <dd className="truncate">{data.deploy.message ?? "—"}</dd>
        </dl>
      </SectionCard>

      {/* Firestore接続 */}
      <SectionCard title="Firestore 接続状況">
        {data.firestore.ok ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <StateBadge state="ok" />
              <span className="text-sm text-text-sub">接続正常</span>
            </div>
            {data.firestore.config && (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm mt-1">
                <dt className="text-text-sub">Bluetooth</dt>
                <dd>{data.firestore.config.enabled ? "有効" : "無効"}</dd>
                <dt className="text-text-sub">スキャン間隔</dt>
                <dd>{data.firestore.config.scanIntervalSeconds != null ? `${data.firestore.config.scanIntervalSeconds}秒` : "—"}</dd>
                <dt className="text-text-sub">警告閾値</dt>
                <dd>{data.warnMinutes}分</dd>
                <dt className="text-text-sub">異常閾値</dt>
                <dd>{data.alertMinutes}分</dd>
              </dl>
            )}
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <StateBadge state="alert" />
            <p className="text-sm text-danger font-mono break-all">{data.firestore.error}</p>
          </div>
        )}
      </SectionCard>

      {/* ブース混雑データ更新状況 */}
      <SectionCard title="ブース 混雑データ更新状況">
        {data.boothsError ? (
          <p className="text-sm text-danger">{data.boothsError}</p>
        ) : data.booths && data.boothSummary ? (
          <>
            <div className="flex gap-3 mb-3">
              <span className="text-sm text-green-700 font-bold">🟢 正常 {data.boothSummary.ok}件</span>
              <span className="text-sm text-yellow-700 font-bold">🟡 警告 {data.boothSummary.warn}件</span>
              <span className="text-sm text-red-700 font-bold">🔴 異常 {data.boothSummary.alert}件</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1 pr-2 text-text-sub font-medium">ブース</th>
                    <th className="text-left py-1 pr-2 text-text-sub font-medium">モード</th>
                    <th className="text-left py-1 pr-2 text-text-sub font-medium">最終更新</th>
                    <th className="text-left py-1 pr-2 text-text-sub font-medium">経過</th>
                    <th className="text-left py-1 text-text-sub font-medium">状態</th>
                  </tr>
                </thead>
                <tbody>
                  {data.booths.map((booth) => (
                    <tr key={booth.boothId} className={`border-b last:border-0 ${booth.state === "alert" ? "bg-red-50" : booth.state === "warn" ? "bg-yellow-50" : ""}`}>
                      <td className="py-1.5 pr-2 font-medium">{booth.name}</td>
                      <td className="py-1.5 pr-2 text-text-sub">{booth.mode}</td>
                      <td className="py-1.5 pr-2 text-text-sub">{booth.updatedAtDisplay}</td>
                      <td className="py-1.5 pr-2 text-text-sub">
                        {booth.elapsedMinutes === 9999 ? "未記録" : `${booth.elapsedMinutes}分前`}
                      </td>
                      <td className="py-1.5"><StateBadge state={booth.state} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-sm text-text-sub">取得できません</p>
        )}
      </SectionCard>

      {/* 直近の通知 */}
      <SectionCard title="直近の通知送信状況">
        {data.noticeError ? (
          <p className="text-sm text-danger">{data.noticeError}</p>
        ) : data.notice ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-text-sub">タイトル</dt>
            <dd className="font-medium">{data.notice.title}</dd>
            <dt className="text-text-sub">送信時刻</dt>
            <dd>{data.notice.createdAt}</dd>
            <dt className="text-text-sub">緊急</dt>
            <dd>{data.notice.isUrgent ? <span className="text-danger font-bold">緊急</span> : "通常"}</dd>
          </dl>
        ) : (
          <p className="text-sm text-text-sub">通知の記録なし</p>
        )}
      </SectionCard>

      {/* Sentryエラー件数 */}
      <SectionCard title="Sentry エラー件数（未解決）">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-1 pr-4 text-text-sub font-medium">プロジェクト</th>
              <th className="text-left py-1 pr-4 text-text-sub font-medium">直近1時間</th>
              <th className="text-left py-1 text-text-sub font-medium">直近24時間</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-1.5 pr-4 font-medium">isf-viewer</td>
              <td className="py-1.5 pr-4"><IssueCount value={data.sentry.viewer.issues1h} /></td>
              <td className="py-1.5"><IssueCount value={data.sentry.viewer.issues24h} /></td>
            </tr>
            <tr>
              <td className="py-1.5 pr-4 font-medium">isf-admin</td>
              <td className="py-1.5 pr-4"><IssueCount value={data.sentry.admin.issues1h} /></td>
              <td className="py-1.5"><IssueCount value={data.sentry.admin.issues24h} /></td>
            </tr>
          </tbody>
        </table>
        {data.sentry.viewer.issues1h === null && (
          <p className="text-xs text-text-sub mt-2">※ SENTRY_API_TOKEN が設定されていない場合は表示されません</p>
        )}
      </SectionCard>
    </div>
  );
}
