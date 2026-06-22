"use client";

import { useState } from "react";
import { isFullAccess, getScopeLabel } from "@/lib/admin-scope";
import LoadingOverlay from "@/components/LoadingOverlay";

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

// 教員用発信元（先生・PTA含む全選択肢）
const TEACHER_AUTHOR_OPTIONS = [
  { value: "1-1", label: "1年1組" }, { value: "1-2", label: "1年2組" },
  { value: "1-3", label: "1年3組" }, { value: "1-4", label: "1年4組" },
  { value: "2-1", label: "2年1組" }, { value: "2-2", label: "2年2組" },
  { value: "2-3", label: "2年3組" }, { value: "2-4", label: "2年4組" },
  { value: "3-1", label: "3年1組" }, { value: "3-2", label: "3年2組" },
  { value: "3-3", label: "3年3組" }, { value: "3-4", label: "3年4組" },
  { value: "eスポーツ部", label: "eスポーツ部" },
  { value: "美術部", label: "美術部" },
  { value: "__teacher__", label: "先生" },
  { value: "実行委員", label: "実行委員会" },
  { value: "キッチンカー", label: "キッチンカー" },
  { value: "PTAバザー", label: "PTAバザー" },
  { value: "__other__", label: "その他" },
];

// 実行委員用発信元（先生なし）
const EXEC_AUTHOR_OPTIONS = [
  { value: "1-1", label: "1年1組" }, { value: "1-2", label: "1年2組" },
  { value: "1-3", label: "1年3組" }, { value: "1-4", label: "1年4組" },
  { value: "2-1", label: "2年1組" }, { value: "2-2", label: "2年2組" },
  { value: "2-3", label: "2年3組" }, { value: "2-4", label: "2年4組" },
  { value: "3-1", label: "3年1組" }, { value: "3-2", label: "3年2組" },
  { value: "3-3", label: "3年3組" }, { value: "3-4", label: "3年4組" },
  { value: "eスポーツ部", label: "eスポーツ部" },
  { value: "美術部", label: "美術部" },
  { value: "実行委員", label: "実行委員会" },
  { value: "キッチンカー", label: "キッチンカー" },
  { value: "PTAバザー", label: "PTAバザー" },
  { value: "__other__", label: "その他" },
];

const TYPE_OPTIONS = [
  { value: "urgent", label: "緊急" },
  { value: "info", label: "お知らせ" },
  { value: "warning", label: "注意" },
  { value: "other", label: "その他" },
];

export default function AdminNoticeClient({ scope }: { scope: string }) {
  const scopeLocked = !isFullAccess(scope);
  const isTeacherScope = scope === "教員";
  const isExecScope = scope === "実行委員";

  // デフォルト発信元: 教員→先生, 実行委員→実行委員会, それ以外→固定
  const initialAuthor = scopeLocked ? scope : isTeacherScope ? "__teacher__" : "実行委員";

  const [authorSelect, setAuthorSelect] = useState(initialAuthor);
  const [teacherName, setTeacherName] = useState("");
  const [otherName, setOtherName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("all");
  const [type, setType] = useState("info");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isTeacher = authorSelect === "__teacher__";
  const isOther = authorSelect === "__other__";

  // 送信対象: 教員のみ先生を含む、クラス・部活・飲食等の限定アカウントはallのみ
  const targets = (!isFullAccess(scope))
    ? ALL_TARGETS.filter((t) => t.value === "all")
    : isTeacherScope
    ? ALL_TARGETS
    : NON_TEACHER_TARGETS;

  // 発信元選択肢
  const authorOptions = isTeacherScope ? TEACHER_AUTHOR_OPTIONS : EXEC_AUTHOR_OPTIONS;

  function resolvedAuthorId() {
    if (isTeacher) return teacherName;
    if (isOther) return otherName;
    return authorSelect;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resolvedAuthorId().trim()) { setError("発信元を入力してください"); return; }
    if (!title.trim()) { setError("タイトルを入力してください"); return; }
    if (!body.trim()) { setError("本文を入力してください"); return; }

    setSaving(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/notice/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorId: resolvedAuthorId().trim(),
        title: title.trim(),
        body: body.trim(),
        target,
        type,
      }),
    });

    setSaving(false);
    if (res.ok) {
      setSuccess("通知を送信しました");
      setTitle("");
      setBody("");
      if (!scopeLocked) setAuthorSelect(isTeacherScope ? "__teacher__" : "実行委員");
      setTarget("all");
      setType("info");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "送信に失敗しました");
    }
  }

  return (
    <>
    <LoadingOverlay visible={saving} label="送信中..." />
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">通知送信</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">発信元 *</label>
          {scopeLocked ? (
            <div className="border rounded-lg px-3 py-2 text-sm bg-gray-50 text-text-sub">
              {getScopeLabel(scope)}
              <span className="ml-2 text-xs text-text-sub">（固定）</span>
            </div>
          ) : (
            <>
              <select
                value={authorSelect}
                onChange={(e) => { setAuthorSelect(e.target.value); setTeacherName(""); setOtherName(""); }}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="" disabled>選択してください</option>
                {authorOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {isTeacher && (
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="先生名を入力"
                  className="border rounded-lg px-3 py-2 text-sm mt-1"
                />
              )}
              {isOther && (
                <input
                  type="text"
                  value={otherName}
                  onChange={(e) => setOtherName(e.target.value)}
                  placeholder="発信元名を入力"
                  className="border rounded-lg px-3 py-2 text-sm mt-1"
                />
              )}
            </>
          )}
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">タイトル *</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
            placeholder="通知タイトル"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">本文 *</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="border rounded-lg px-3 py-2 text-sm resize-none"
            placeholder="通知本文"
          />
        </label>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">送信対象</label>
          {!isFullAccess(scope) ? (
            <div className="border rounded-lg px-3 py-2 text-sm bg-gray-50 text-text-sub">
              全ユーザー (all)
              <span className="ml-2 text-xs text-text-sub">（固定）</span>
            </div>
          ) : (
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              {targets.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          )}
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
          <p className="text-xs text-gray-400 mt-0.5">すべての種別でプッシュ通知が送信されます</p>
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}
        {success && <p className="text-xs text-green-600">{success}</p>}

        <button
          type="submit"
          disabled={saving}
          className="py-2 rounded-lg bg-primary text-white font-bold text-sm disabled:opacity-50"
        >
          {saving ? "送信中..." : "送信"}
        </button>
      </form>
    </div>
    </>
  );
}
