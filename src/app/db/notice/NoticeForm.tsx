"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useConfirm } from "@/hooks/useConfirm";

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

const AUTHOR_OPTIONS = [
  { value: "", label: "選択してください" },
  { value: "1-1", label: "1年1組" },
  { value: "1-2", label: "1年2組" },
  { value: "1-3", label: "1年3組" },
  { value: "1-4", label: "1年4組" },
  { value: "2-1", label: "2年1組" },
  { value: "2-2", label: "2年2組" },
  { value: "2-3", label: "2年3組" },
  { value: "2-4", label: "2年4組" },
  { value: "3-1", label: "3年1組" },
  { value: "3-2", label: "3年2組" },
  { value: "3-3", label: "3年3組" },
  { value: "3-4", label: "3年4組" },
  { value: "eスポーツ部", label: "eスポーツ部" },
  { value: "美術部", label: "美術部" },
  { value: "有志発表", label: "有志発表" },
  { value: "__teacher__", label: "先生" },
  { value: "キッチンカー", label: "キッチンカー" },
  { value: "__other__", label: "その他" },
];

const TYPE_OPTIONS = [
  { value: "urgent", label: "緊急" },
  { value: "info", label: "お知らせ" },
  { value: "warning", label: "注意" },
  { value: "other", label: "その他" },
];

interface NoticeFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: {
    authorId?: string;
    title?: string;
    body?: string;
    target?: string;
    type?: string;
  };
  isEdit?: boolean;
}

function guessAuthorSelect(authorId?: string): string {
  if (!authorId) return "";
  const fixed = AUTHOR_OPTIONS.find(
    (o) => o.value === authorId && o.value !== "__teacher__" && o.value !== "__other__"
  );
  if (fixed) return fixed.value;
  return "__other__";
}

export function NoticeForm({ action, defaultValues = {}, isEdit = false }: NoticeFormProps) {
  const [noticeType, setNoticeType] = useState(defaultValues.type ?? "info");
  const [isPending, startTransition] = useTransition();
  const { confirm, confirmState, handleResult } = useConfirm();
  const [authorSelect, setAuthorSelect] = useState(() => guessAuthorSelect(defaultValues.authorId));
  const [teacherName, setTeacherName] = useState(
    authorSelect === "__teacher__" ? (defaultValues.authorId ?? "") : ""
  );
  const [otherName, setOtherName] = useState(
    authorSelect === "__other__" ? (defaultValues.authorId ?? "") : ""
  );

  const isTeacher = authorSelect === "__teacher__";
  const isOther = authorSelect === "__other__";
  const targets = isTeacher ? ALL_TARGETS : NON_TEACHER_TARGETS;
  const isUrgent = noticeType === "urgent";

  function resolvedAuthorId(): string {
    if (isTeacher) return teacherName;
    if (isOther) return otherName;
    return authorSelect;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (isUrgent) {
      const ok1 = await confirm("【緊急通知】内容を確認しましたか？"); if (!ok1) return;
      const ok2 = await confirm("本当に送信しますか？この操作は取り消せません。"); if (!ok2) return;
    } else {
      const ok = await confirm(isEdit ? "変更を保存しますか？" : "作成しますか？"); if (!ok) return;
    }
    const fd = new FormData(form);
    fd.set("type", noticeType);
    fd.set("authorId", resolvedAuthorId());
    startTransition(async () => { await action(fd); });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">発信元</span>
        <select
          value={authorSelect}
          onChange={(e) => setAuthorSelect(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          {AUTHOR_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {isTeacher && (
          <input
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm mt-1"
            placeholder="先生名を入力"
          />
        )}
        {isOther && (
          <input
            value={otherName}
            onChange={(e) => setOtherName(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm mt-1"
            placeholder="発信元を入力"
          />
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">通知種別</span>
        <select
          value={noticeType}
          onChange={(e) => setNoticeType(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

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
          {targets.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        {!isTeacher && (
          <p className="text-xs text-gray-400 mt-0.5">※ 先生全体への通知は発信元を「先生」にした場合のみ選択できます</p>
        )}
      </label>

      {isUrgent && (
        <div className="bg-red-50 border border-danger rounded p-3 text-xs text-danger">
          緊急通知は全対象に優先的に配信されます。誤送信に注意してください。（2段階確認あり）
        </div>
      )}

      <div className="flex gap-3 mt-2">
        <a href="/db/notice" className="flex-1 text-center py-2 rounded-lg border text-sm">キャンセル</a>
        <button type="submit" disabled={isPending} className="flex-1 py-2 rounded-lg bg-primary text-white font-bold text-sm disabled:opacity-60">
          {isPending ? "保存中…" : isEdit ? "保存" : "作成"}
        </button>
      </div>
      {confirmState && <ConfirmDialog message={confirmState.message} onConfirm={() => handleResult(true)} onCancel={() => handleResult(false)} />}
    </form>
  );
}
