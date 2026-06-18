"use client";

import { useState } from "react";

interface EatFormProps {
  action: (formData: FormData) => Promise<void>;
  type: "car" | "pta";
  defaultValues?: {
    name?: string;
    location?: string;
    description?: string;
    boothImage?: string;
    status?: number;
  };
  isEdit?: boolean;
}

export function EatForm({ action, type, defaultValues = {}, isEdit = false }: EatFormProps) {
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!confirm(isEdit ? "変更を保存しますか？" : "作成しますか？")) return;
    setPending(true);
    const fd = new FormData(e.currentTarget);
    await action(fd);
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">名前 <span className="text-danger">*</span></span>
        <input name="name" defaultValue={defaultValues.name ?? ""} required className="border rounded-lg px-3 py-2 text-sm" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">場所</span>
        <input name="location" defaultValue={defaultValues.location ?? ""} className="border rounded-lg px-3 py-2 text-sm" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">説明</span>
        <textarea name="description" defaultValue={defaultValues.description ?? ""} rows={3} className="border rounded-lg px-3 py-2 text-sm resize-none" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">画像URL</span>
        <input name="boothImage" defaultValue={defaultValues.boothImage ?? ""} type="url" className="border rounded-lg px-3 py-2 text-sm" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">状態</span>
        <select name="status" defaultValue={defaultValues.status ?? 1} className="border rounded-lg px-3 py-2 text-sm">
          <option value={0}>0 停止中</option>
          <option value={1}>1 非常に閑散</option>
          <option value={2}>2 閑散</option>
          <option value={3}>3 通常</option>
          <option value={4}>4 混雑</option>
          <option value={5}>5 非常に混雑</option>
        </select>
      </label>
      <div className="flex gap-3 mt-2">
        <a href={`/db/eat/${type}`} className="flex-1 text-center py-2 rounded-lg border text-sm">キャンセル</a>
        <button type="submit" disabled={pending} className="flex-1 py-2 rounded-lg bg-primary text-white font-bold text-sm disabled:opacity-60">
          {pending ? "保存中…" : isEdit ? "保存" : "作成"}
        </button>
      </div>
    </form>
  );
}
