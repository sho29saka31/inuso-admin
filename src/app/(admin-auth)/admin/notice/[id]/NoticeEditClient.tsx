"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isFullAccess, getScopeLabel } from "@/lib/admin-scope";

const ALL_TARGETS = [
  { value: "all", label: "全ユーザー (all)" },
  { value: "guest", label: "ゲストのみ (guest)" },
  { value: "edu", label: "生徒全体 (edu)" },
  { value: "prof", label: "先生全体 (prof)" },
  { value: "1nen", label: "1年全体 (1nen)" },
  { value: "2nen", label: "2年全体 (2nen)" },
  { value: "3nen", label: "3年全体 (3nen)" },
];
const NON_TEACHER_TARGETS = ALL_TARGETS.filter((t) => t.value !== "prof");

const TYPE_OPTIONS = [
  { value: "urgent", label: "緊急" },
  { value: "info", label: "お知らせ" },
  { value: "warning", label: "注意" },
  { value: "other", label: "その他" },
];

export default function NoticeEditClient({
  notice,
  scope,
}: {
  notice: Record<string, unknown>;
  scope: string;
}) {
  const router = useRouter();
  const scopeLocked = !isFullAccess(scope);

  const [title, setTitle] = useState((notice.title ?? "") as string);
  const [body, setBody] = useState((notice.body ?? "") as string);
  const [target, setTarget] = useState((notice.target ?? "all") as string);
  const [type, setType] = useState((notice.type ?? "info") as string);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const targets = isFullAccess(scope) ? ALL_TARGETS : NON_TEACHER_TARGETS;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("タイトルを入力してください"); return; }
    if (!body.trim()) { setError("本文を入力してください"); return; }

    setSaving(true);
    setError("");
    const res = await fetch("/api/notice/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        noticeId: notice.noticeId,
        authorId: notice.authorId,
        title: title.trim(),
        body: body.trim(),
        target,
        type,
      }),
    });
    setSaving(false);
    if (res.ok) {
      router.push("/admin/notice/history");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "保存に失敗しました");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">通知編集</h1>
        <p className="text-xs text-text-sub mt-0.5">{notice.noticeId as string}</p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">発信元</label>
          <div className="border rounded-lg px-3 py-2 text-sm bg-gray-50 text-text-sub">
            {scopeLocked ? getScopeLabel(scope) : (notice.authorId as string)}
            <span className="ml-2 text-xs">（変更不可）</span>
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">タイトル *</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">本文 *</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="border rounded-lg px-3 py-2 text-sm resize-none"
          />
        </label>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">送信対象</label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {targets.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">通知種別</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-2 rounded-lg border text-sm font-medium"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2 rounded-lg bg-primary text-white font-bold text-sm disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </form>
    </div>
  );
}
