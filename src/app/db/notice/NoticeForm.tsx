"use client";

import { useState } from "react";

const TARGETS = [
  { value: "all", label: "全ユーザー (all)" },
  { value: "guest", label: "ゲストのみ (guest)" },
  { value: "edu", label: "生徒全体 (edu)" },
  { value: "prof", label: "先生全体 (prof)" },
  { value: "1nen", label: "1年全体 (1nen)" },
  { value: "2nen", label: "2年全体 (2nen)" },
  { value: "3nen", label: "3年全体 (3nen)" },
];

interface NoticeFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: {
    authorId?: string;
    title?: string;
    body?: string;
    target?: string;
    isUrgent?: boolean;
  };
  isEdit?: boolean;
}

export function NoticeForm({ action, defaultValues = {}, isEdit = false }: NoticeFormProps) {
  const [isUrgent, setIsUrgent] = useState(defaultValues.isUrgent ?? false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isUrgent) {
      if (!confirm("【緊急通知】内容を確認しましたか？")) return;
      if (!confirm("本当に送信しますか？この操作は取り消せません。")) return;
    } else {
      if (!confirm(isEdit ? "変更を保存しますか？" : "作成しますか？")) return;
    }
    setPending(true);
    const fd = new FormData(e.currentTarget);
    fd.set("isUrgent", isUrgent ? "true" : "false");
    await action(fd);
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">発信元（authorId）</span>
        <input name="authorId" defaultValue={defaultValues.authorId ?? ""} className="border rounded-lg px-3 py-2 text-sm" placeholder="例: 教員名 / クラス名" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">タイトル <span className="text-danger">*</span></span>
        <input name="title" defaultValue={defaultValues.title ?? ""} required className="border rounded-lg px-3 py-2 text-sm" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">本文 <span className="text-danger">*</span></span>
        <textarea name="body" defaultValue={defaultValues.body ?? ""} required rows={4} className="border rounded-lg px-3 py-2 text-sm resize-none" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">通知対象 <span className="text-danger">*</span></span>
        <select name="target" defaultValue={defaultValues.target ?? "all"} className="border rounded-lg px-3 py-2 text-sm">
          {TARGETS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isUrgent}
          onChange={(e) => setIsUrgent(e.target.checked)}
          className="rounded"
        />
        <span className="text-sm font-medium">
          緊急通知 <span className="text-xs text-warning">（2段階確認あり）</span>
        </span>
      </label>

      {isUrgent && (
        <div className="bg-red-50 border border-danger rounded p-3 text-xs text-danger">
          緊急通知は全対象に優先的に配信されます。誤送信に注意してください。
        </div>
      )}

      <div className="flex gap-3 mt-2">
        <a href="/db/notice" className="flex-1 text-center py-2 rounded-lg border text-sm">キャンセル</a>
        <button type="submit" disabled={pending} className="flex-1 py-2 rounded-lg bg-primary text-white font-bold text-sm disabled:opacity-60">
          {pending ? "保存中…" : isEdit ? "保存" : "作成"}
        </button>
      </div>
    </form>
  );
}
