"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isFullAccess } from "@/lib/admin-scope";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useConfirm } from "@/hooks/useConfirm";

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

export interface Notice {
  noticeId: string;
  title: string;
  body?: string;
  authorId: string;
  type?: string;
  target?: string;
  createdAt?: { display?: string };
}

function canEdit(notice: Notice, scope: string): boolean {
  if (isFullAccess(scope)) return true;
  return notice.authorId === scope;
}

export default function NoticeHistoryClient({
  notices,
  scope,
}: {
  notices: Notice[] | null;
  scope: string;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { confirm, confirmState, handleResult } = useConfirm();

  async function handleDelete(noticeId: string) {
    const ok = await confirm("この通知を削除しますか？"); if (!ok) return;
    setDeletingId(noticeId);
    await fetch("/api/notice/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noticeId }),
    });
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">通知履歴</h1>

      {notices === null ? (
        <p className="text-danger text-sm">Firebase未設定。</p>
      ) : notices.length === 0 ? (
        <p className="text-text-sub text-sm">送信済み通知がありません。</p>
      ) : (
        <div className="flex flex-col gap-2">
          {notices.map((n) => {
            const editable = canEdit(n, scope);
            return (
              <div key={n.noticeId} className="bg-white rounded-xl border p-3 flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      TYPE_COLORS[n.type ?? "info"] ?? TYPE_COLORS.info
                    }`}
                  >
                    {TYPE_LABELS[n.type ?? "info"] ?? n.type}
                  </span>
                  <span className="text-sm font-medium truncate">{n.title}</span>
                </div>
                {n.body && (
                  <p className="text-xs text-text-sub line-clamp-2">{n.body}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap text-xs text-text-sub mt-0.5">
                  <span>発信: {n.authorId}</span>
                  <span>対象: {TARGET_LABELS[n.target ?? "all"] ?? n.target}</span>
                  <span className="ml-auto">{n.createdAt?.display ?? ""}</span>
                </div>
                {editable && (
                  <div className="flex gap-2 mt-1.5 pt-1.5 border-t">
                    <Link
                      href={`/admin/notice/${n.noticeId}`}
                      className="text-xs px-3 py-1 rounded border border-primary text-primary font-medium"
                    >
                      編集
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(n.noticeId)}
                      disabled={deletingId === n.noticeId}
                      className="text-xs px-3 py-1 rounded border border-danger text-danger font-medium disabled:opacity-50"
                    >
                      {deletingId === n.noticeId ? "削除中..." : "削除"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {confirmState && <ConfirmDialog message={confirmState.message} onConfirm={() => handleResult(true)} onCancel={() => handleResult(false)} />}
    </div>
  );
}
