"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useConfirm } from "@/hooks/useConfirm";

interface Product {
  name: string;
  price: number;
}

interface EatFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: {
    products?: Product[];
    instagramUrl?: string;
  };
}

export function EatForm({ action, defaultValues = {} }: EatFormProps) {
  const [isPending, startTransition] = useTransition();
  const { confirm, confirmState, handleResult } = useConfirm();
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
    const form = e.currentTarget;
    const ok = await confirm("変更を保存しますか？"); if (!ok) return;

    const fd = new FormData(form);
    products.forEach((p, i) => {
      fd.set(`product_name_${i}`, p.name);
      fd.set(`product_price_${i}`, String(p.price));
    });
    startTransition(async () => { await action(fd); });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">公式インスタアドレス</span>
        <input
          name="instagramUrl"
          defaultValue={defaultValues.instagramUrl ?? ""}
          type="url"
          placeholder="https://www.instagram.com/..."
          className="border rounded-lg px-3 py-2 text-sm"
        />
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

      <div className="flex gap-3 mt-2">
        <a href="/db/eat" className="flex-1 text-center py-2 rounded-lg border text-sm">キャンセル</a>
        <button type="submit" disabled={isPending} className="flex-1 py-2 rounded-lg bg-primary text-white font-bold text-sm disabled:opacity-60">
          {isPending ? "保存中…" : "保存"}
        </button>
      </div>
      {confirmState && <ConfirmDialog message={confirmState.message} onConfirm={() => handleResult(true)} onCancel={() => handleResult(false)} />}
    </form>
  );
}
