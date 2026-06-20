"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LoadingOverlay from "@/components/LoadingOverlay";

const STATUS_LABELS = ["停止中", "非常に閑散", "閑散", "通常", "混雑", "非常に混雑"];

export function BoothEditClient({ booth }: { booth: Record<string, unknown> }) {
  const router = useRouter();
  const name = (booth.name ?? booth.shopName) as string;
  const [status, setStatus] = useState(Number(booth.status ?? 3));
  const [waitCount, setWaitCount] = useState(Number(booth.waitCount ?? 0));
  const [isManual, setIsManual] = useState(Boolean(booth.isManual ?? false));
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/booth/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boothId: booth.boothId, status, waitCount, isManual }),
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
    <>
    <LoadingOverlay visible={saving} />
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">{name}</h1>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-xl border p-4 bg-white">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">更新モード</span>
            <span className="text-xs text-text-sub">
              {isManual ? "手動 — Bluetooth自動更新を無視" : "自動 — Bluetoothで自動更新"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsManual((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
              isManual ? "bg-primary" : "bg-gray-200"
            }`}
            role="switch"
            aria-checked={isManual}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                isManual ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

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

      <p className="text-xs text-text-sub border rounded-lg p-3 bg-gray-50">
        他の物を編集したい場合はDB管理者までお声がけください。
      </p>

      {error && <p className="text-xs text-danger">{error}</p>}

      {confirming ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-sm font-medium">「{name}」のステータスを更新しますか？</p>
          <p className="text-xs text-text-sub">
            モード: {isManual ? "手動" : "自動"} / 状態: {STATUS_LABELS[status]} / 待ち: {waitCount}組
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
    </>
  );
}
