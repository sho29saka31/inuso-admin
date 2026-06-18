"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "false", label: "遅延なし" },
  { value: "true", label: "遅延あり" },
];

export function EventEditClient({ event }: { event: Record<string, unknown> }) {
  const router = useRouter();
  const [isDelayed, setIsDelayed] = useState(Boolean(event.isDelayed));
  const [delayMinutes, setDelayMinutes] = useState(Number(event.delayMinutes ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/event/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: event.eventId,
        isDelayed,
        delayMinutes,
      }),
    });
    setSaving(false);
    if (res.ok) {
      router.push("/admin/event");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "保存に失敗しました");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">{event.eventName as string}</h1>
        <p className="text-sm text-text-sub">
          {event.day as string} {event.startTime as string}〜{event.endTime as string} / {event.location as string}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">遅延状態</label>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setIsDelayed(opt.value === "true")}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  isDelayed === (opt.value === "true")
                    ? "bg-primary text-white border-primary"
                    : "border-gray-200 text-text-main"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {isDelayed && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">遅延分数</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setDelayMinutes((v) => Math.max(0, v - 5))}
                className="w-10 h-10 rounded-lg border text-lg font-bold flex items-center justify-center"
              >
                −
              </button>
              <span className="text-2xl font-bold w-16 text-center">{delayMinutes}分</span>
              <button
                type="button"
                onClick={() => setDelayMinutes((v) => v + 5)}
                className="w-10 h-10 rounded-lg border text-lg font-bold flex items-center justify-center"
              >
                ＋
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-2 rounded-lg border text-sm font-medium"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2 rounded-lg bg-primary text-white font-bold text-sm disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </div>
    </div>
  );
}
