"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LoadingOverlay from "@/components/LoadingOverlay";

const STATUS_LABELS = ["停止中", "非常に閑散", "閑散", "通常", "混雑", "非常に混雑"];
const STATUS_COLORS = ["text-gray-500", "text-blue-500", "text-green-500", "text-yellow-600", "text-orange-500", "text-red-500"];

export function BoothEditClient({ booth }: { booth: Record<string, unknown> }) {
  const router = useRouter();
  const name = (booth.name ?? booth.shopName) as string;

  const initialStatus = Number(booth.status ?? 3);
  const [status, setStatus] = useState(initialStatus);
  const [prevNonZeroStatus, setPrevNonZeroStatus] = useState(initialStatus === 0 ? 3 : initialStatus);
  const [waitCount, setWaitCount] = useState(Number(booth.waitCount ?? 0));
  const [isManual, setIsManual] = useState(Boolean(booth.isManual ?? false));
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isStopped = status === 0;

  function handleStopToggle() {
    if (isStopped) {
      setStatus(prevNonZeroStatus);
    } else {
      setPrevNonZeroStatus(status);
      setStatus(0);
    }
  }

  function handleSliderChange(val: number) {
    setStatus(val);
    setPrevNonZeroStatus(val);
  }

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
      router.push("/admin/mybooth");
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
        {/* 更新モード */}
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

        {/* 停止トグル */}
        <div className={`flex items-center justify-between rounded-xl border p-4 bg-white transition-opacity ${!isManual ? "opacity-40 pointer-events-none" : ""}`}>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">停止</span>
            <span className="text-xs text-text-sub">
              {isStopped ? "停止中（status: 0）" : "通常営業中"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleStopToggle}
            disabled={!isManual}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
              isStopped ? "bg-gray-400" : "bg-gray-200"
            }`}
            role="switch"
            aria-checked={isStopped}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                isStopped ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* 混雑状態スライダー */}
        <div className={`flex flex-col gap-3 rounded-xl border p-4 bg-white transition-opacity ${(!isManual || isStopped) ? "opacity-40 pointer-events-none" : ""}`}>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">混雑状態</label>
            <span className={`text-sm font-bold ${STATUS_COLORS[status]}`}>
              {STATUS_LABELS[status]}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            value={isStopped ? prevNonZeroStatus : status}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            disabled={!isManual || isStopped}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-text-sub">
            <span>閑散</span>
            <span>通常</span>
            <span>混雑</span>
          </div>
        </div>

        {/* 待ち組数 */}
        <div className={`flex flex-col gap-2 rounded-xl border p-4 bg-white transition-opacity ${!isManual ? "opacity-40 pointer-events-none" : ""}`}>
          <label className="text-sm font-medium">待ち組数</label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setWaitCount((v) => Math.max(0, v - 1))}
              disabled={!isManual}
              className="w-10 h-10 rounded-lg border text-lg font-bold flex items-center justify-center disabled:opacity-40"
            >
              −
            </button>
            <span className="text-2xl font-bold w-12 text-center">{waitCount}</span>
            <button
              type="button"
              onClick={() => setWaitCount((v) => v + 1)}
              disabled={!isManual}
              className="w-10 h-10 rounded-lg border text-lg font-bold flex items-center justify-center disabled:opacity-40"
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
