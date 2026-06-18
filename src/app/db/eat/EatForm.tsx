"use client";

import { useState } from "react";

interface Product {
  name: string;
  price: number;
}

interface EatFormProps {
  action: (formData: FormData) => Promise<void>;
  showTypeSelect?: boolean;
  defaultType?: "car" | "pta";
  defaultValues?: {
    shopName?: string;
    instagramUrl?: string;
    products?: Product[];
    imageUrl?: string;
    status?: number;
  };
  isEdit?: boolean;
}

const STATUS_OPTIONS = [
  { value: 0, label: "0 停止中" },
  { value: 1, label: "1 非常に閑散" },
  { value: 2, label: "2 閑散" },
  { value: 3, label: "3 通常" },
  { value: 4, label: "4 混雑" },
  { value: 5, label: "5 非常に混雑" },
];

export function EatForm({ action, showTypeSelect = false, defaultType = "car", defaultValues = {}, isEdit = false }: EatFormProps) {
  const [pending, setPending] = useState(false);
  const [products, setProducts] = useState<Product[]>(
    defaultValues.products && defaultValues.products.length > 0
      ? defaultValues.products
      : [{ name: "", price: 0 }]
  );

  function addProduct() {
    setProducts((prev) => [...prev, { name: "", price: 0 }]);
  }

  function removeProduct(index: number) {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  }

  function updateProduct(index: number, field: "name" | "price", value: string) {
    setProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: field === "price" ? Number(value) : value } : p))
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!confirm(isEdit ? "変更を保存しますか？" : "作成しますか？")) return;
    setPending(true);
    const fd = new FormData(e.currentTarget);
    products.forEach((p, i) => {
      fd.set(`product_name_${i}`, p.name);
      fd.set(`product_price_${i}`, String(p.price));
    });
    await action(fd);
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {showTypeSelect && (
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">種別 <span className="text-danger">*</span></span>
          <select name="type" defaultValue={defaultType} className="border rounded-lg px-3 py-2 text-sm">
            <option value="car">キッチンカー</option>
            <option value="pta">PTAバザー</option>
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">店名 <span className="text-danger">*</span></span>
        <input name="shopName" defaultValue={defaultValues.shopName ?? ""} required className="border rounded-lg px-3 py-2 text-sm" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">公式インスタアドレス</span>
        <input name="instagramUrl" defaultValue={defaultValues.instagramUrl ?? ""} type="url" placeholder="https://www.instagram.com/..." className="border rounded-lg px-3 py-2 text-sm" />
      </label>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">販売商品</span>
          <button type="button" onClick={addProduct} className="text-xs px-3 py-1 rounded border border-primary text-primary">
            + 追加
          </button>
        </div>
        {products.map((p, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              value={p.name}
              onChange={(e) => updateProduct(i, "name", e.target.value)}
              placeholder="商品名"
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex items-center border rounded-lg overflow-hidden">
              <input
                value={p.price}
                onChange={(e) => updateProduct(i, "price", e.target.value)}
                type="number"
                min={0}
                placeholder="値段"
                className="w-24 px-3 py-2 text-sm outline-none"
              />
              <span className="pr-2 text-sm text-text-sub">円</span>
            </div>
            {products.length > 1 && (
              <button type="button" onClick={() => removeProduct(i)} className="text-danger text-xs px-2">
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">画像URL</span>
        <input name="imageUrl" defaultValue={defaultValues.imageUrl ?? ""} type="url" className="border rounded-lg px-3 py-2 text-sm" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">混雑状況</span>
        <select name="status" defaultValue={defaultValues.status ?? 1} className="border rounded-lg px-3 py-2 text-sm">
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>

      <div className="flex gap-3 mt-2">
        <a href="/db/eat" className="flex-1 text-center py-2 rounded-lg border text-sm">キャンセル</a>
        <button type="submit" disabled={pending} className="flex-1 py-2 rounded-lg bg-primary text-white font-bold text-sm disabled:opacity-60">
          {pending ? "保存中…" : isEdit ? "保存" : "作成"}
        </button>
      </div>
    </form>
  );
}
