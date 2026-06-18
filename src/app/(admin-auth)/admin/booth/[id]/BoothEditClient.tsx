"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_LABELS = ["停止中", "非常に閑散", "閑散", "通常", "混雑", "非常に混雑"];

export function BoothEditClient({ booth }: { booth: Record<string, unknown> }) {
  const router = useRouter();
  const name = (booth.name ?? booth.shopName) as string;
  const [status, setStatus] = useState(Number(booth.status ?? 3));
  const [waitCount, setWaitCount] = useState(Number(booth.waitCount ?? 0));
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/booth/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boothId: booth.boothId, status, waitCount }),
    });
    setSaving(false);
    if (res.ok) {
      router.push("/admin/booth");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "保存に失敗しました");
      setConfirming(false);
    }
  }

  return (
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
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      {confirming ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-sm font-medium">
            「{name}」のステータスを更新しますか？
          </p>
          <p className="text-xs text-text-sub">
            状態: {STATUS_LABELS[status]} / 待ち: {waitCount}組
          </p>
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
  );
}
