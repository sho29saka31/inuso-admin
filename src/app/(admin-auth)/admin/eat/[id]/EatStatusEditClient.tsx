"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LoadingOverlay from "@/components/LoadingOverlay";

const STATUS_LABELS = ["停止中", "非常に閑散", "閑散", "通常", "混雑", "非常に混雑"];

interface Product {
  name: string;
  price: number;
  isSoldOut?: boolean;
}

export function EatStatusEditClient({ booth }: { booth: Record<string, unknown> }) {
  const router = useRouter();
  const name = (booth.shopName ?? booth.name) as string;
  const [status, setStatus] = useState(Number(booth.status ?? 3));
  const [waitCount, setWaitCount] = useState(Number(booth.waitCount ?? 0));
  const [products, setProducts] = useState<Product[]>(
    ((booth.products as Product[] | undefined) ?? []).map((p) => ({
      name: p.name,
      price: p.price,
      isSoldOut: p.isSoldOut ?? false,
    }))
  );
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleSoldOut(idx: number) {
    setProducts((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, isSoldOut: !p.isSoldOut } : p))
    );
  }

  function updateProduct(idx: number, field: "name" | "price", value: string) {
    setProducts((prev) =>
      prev.map((p, i) =>
        i === idx ? { ...p, [field]: field === "price" ? Number(value) : value } : p
      )
    );
  }

  function addProduct() {
    setProducts((prev) => [...prev, { name: "", price: 0, isSoldOut: false }]);
  }

  function removeProduct(idx: number) {
    setProducts((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/booth/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boothId: booth.boothId,
        status,
        waitCount,
        products: products.filter((p) => p.name.trim()),
      }),
    });
    setSaving(false);
    if (res.ok) {
      router.push("/admin/eat");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "保存に失敗しました");
      setConfirming(false);
    }
  }

  return (
    <>
    <LoadingOverlay visible={saving} />
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">{name}</h1>
        <p className="text-sm text-text-sub">{booth.boothId as string}</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">混雑状態</label>
          <select
            value={status}
            onChange={(e) => setStatus(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {STATUS_LABELS.map((label, i) => (
              <option key={i} value={i}>
                {i} — {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">待ち組数</label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setWaitCount((v) => Math.max(0, v - 1))}
              className="w-10 h-10 rounded-lg border text-lg font-bold flex items-center justify-center"
            >
              −
            </button>
            <span className="text-2xl font-bold w-12 text-center">{waitCount}</span>
            <button
              type="button"
              onClick={() => setWaitCount((v) => v + 1)}
              className="w-10 h-10 rounded-lg border text-lg font-bold flex items-center justify-center"
            >
              ＋
            </button>
          </div>
        </div>

        {products.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">販売商品</label>
              <button
                type="button"
                onClick={addProduct}
                className="text-xs px-2 py-1 rounded border border-primary text-primary"
              >
                + 追加
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {products.map((p, i) => (
                <div key={i} className="bg-white border rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={p.name}
                      onChange={(e) => updateProduct(i, "name", e.target.value)}
                      placeholder="商品名"
                      className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
                    />
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <input
                        value={p.price}
                        onChange={(e) => updateProduct(i, "price", e.target.value)}
                        type="number"
                        min={0}
                        className="w-20 px-2 py-1.5 text-sm outline-none"
                      />
                      <span className="pr-2 text-xs text-text-sub">円</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProduct(i)}
                      className="text-danger text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={p.isSoldOut ?? false}
                      onChange={() => toggleSoldOut(i)}
                      className="h-4 w-4 accent-danger"
                    />
                    <span className={`text-xs font-medium ${p.isSoldOut ? "text-danger" : "text-text-sub"}`}>
                      {p.isSoldOut ? "売り切れ" : "販売中"}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {products.length === 0 && (
          <button
            type="button"
            onClick={addProduct}
            className="text-sm text-primary border border-dashed border-primary rounded-xl py-3"
          >
            + 販売商品を追加
          </button>
        )}
      </div>

      <p className="text-xs text-text-sub border rounded-lg p-3 bg-gray-50">
        他の物を編集したい場合はDB管理者までお声がけください。
      </p>

      {error && <p className="text-xs text-danger">{error}</p>}

      {confirming ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-sm font-medium">「{name}」の情報を更新しますか？</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-primary text-white font-bold text-sm disabled:opacity-50"
            >
              {saving ? "保存中..." : "確定"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="flex-1 py-2 rounded-lg border text-sm font-medium"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="py-2 rounded-lg bg-primary text-white font-bold text-sm"
        >
          保存
        </button>
      )}
    </div>
    </>
  );
}
