"use client";

import { useState } from "react";

const CATEGORIES = [
  { value: "class", label: "クラス" },
  { value: "club", label: "部活動" },
  { value: "eat", label: "飲食" },
  { value: "act", label: "有志" },
];

interface BoothFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: {
    boothId?: string;
    category?: string;
    name?: string;
    location?: string;
    description?: string;
    boothImage?: string;
    status?: number;
  };
  isEdit?: boolean;
}

export function BoothForm({ action, defaultValues = {}, isEdit = false }: BoothFormProps) {
  const [category, setCategory] = useState(defaultValues.category ?? "class");
  const [pending, setPending] = useState(false);

  function generateBoothId(cat: string, name: string) {
    if (cat === "class") return "";
    if (cat === "club") return `club-${name.toLowerCase().replace(/\s+/g, "-")}`;
    if (cat === "eat") return `eat-car-1`;
    if (cat === "act") return `act-${name.toLowerCase().replace(/\s+/g, "-")}`;
    return "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!confirm(isEdit ? "変更を保存しますか？" : "新規作成しますか？")) return;
    setPending(true);
    const fd = new FormData(e.currentTarget);
    await action(fd);
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!isEdit && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-800">
          <p className="font-medium mb-1">boothId 命名規則</p>
          <p>クラス: class&#123;grade&#125;&#123;num&#125; 例) class1-1</p>
          <p>部活: club-&#123;name&#125; 例) club-art</p>
          <p>飲食: eat-car-&#123;num&#125; or eat-pta</p>
          <p>有志: act-&#123;name&#125;</p>
        </div>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">boothId <span className="text-danger">*</span></span>
        <input
          name="boothId"
          defaultValue={defaultValues.boothId ?? ""}
          required
          disabled={isEdit}
          className="border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
          placeholder="例: class1-1"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">カテゴリ <span className="text-danger">*</span></span>
        <select
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">ブース名 <span className="text-danger">*</span></span>
        <input
          name="name"
          defaultValue={defaultValues.name ?? ""}
          required
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="例: 1年1組 △△△"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">場所 <span className="text-danger">*</span></span>
        <input
          name="location"
          defaultValue={defaultValues.location ?? ""}
          required
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="例: A棟2階 1-1教室"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">説明</span>
        <textarea
          name="description"
          defaultValue={defaultValues.description ?? ""}
          rows={3}
          className="border rounded-lg px-3 py-2 text-sm resize-none"
          placeholder="発表内容の説明"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">画像URL</span>
        <input
          name="boothImage"
          defaultValue={defaultValues.boothImage ?? ""}
          type="url"
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="https://..."
        />
      </label>

      {isEdit && (
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
      )}

      <div className="flex gap-3 mt-2">
        <a href="/db/booth" className="flex-1 text-center py-2 rounded-lg border text-sm">
          キャンセル
        </a>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 py-2 rounded-lg bg-primary text-white font-bold text-sm disabled:opacity-60"
        >
          {pending ? "保存中…" : isEdit ? "保存" : "作成"}
        </button>
      </div>
    </form>
  );
}
