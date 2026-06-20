"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EventEditClient({ event }: { event: Record<string, unknown> }) {
  const router = useRouter();
  const [startTime, setStartTime] = useState((event.startTime ?? "") as string);
  const [endTime, setEndTime] = useState((event.endTime ?? "") as string);
  const [location, setLocation] = useState((event.location ?? "") as string);
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
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        location: location.trim(),
        isDelayed,
        delayMinutes: isDelayed ? delayMinutes : 0,
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
        <p className="text-sm text-text-sub">{event.day as string}</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <label className="flex-1 flex flex-col gap-1">
            <span className="text-sm font-medium">開始時刻</span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <label className="flex-1 flex flex-col gap-1">
            <span className="text-sm font-medium">終了時刻</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">場所</span>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="例: 体育館"
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </label>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">遅延状態</label>
          <div className="flex gap-2">
            {[
              { value: false, label: "遅延なし" },
              { value: true, label: "遅延あり" },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  setIsDelayed(opt.value);
                  if (!opt.value) setDelayMinutes(0);
                }}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  isDelayed === opt.value
                    ? "bg-primary text-white border-primary"
                    : "border-gray-200 text-text-main"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            遅延分数
            {!isDelayed && <span className="ml-1 text-xs text-text-sub">（遅延ありの時のみ）</span>}
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              disabled={!isDelayed}
              onClick={() => setDelayMinutes((v) => Math.max(0, v - 5))}
              className="w-10 h-10 rounded-lg border text-lg font-bold flex items-center justify-center disabled:opacity-30"
            >
              −
            </button>
            <span className={`text-2xl font-bold w-16 text-center ${!isDelayed ? "text-gray-300" : ""}`}>
              {delayMinutes}分
            </span>
            <button
              type="button"
              disabled={!isDelayed}
              onClick={() => setDelayMinutes((v) => v + 5)}
              className="w-10 h-10 rounded-lg border text-lg font-bold flex items-center justify-center disabled:opacity-30"
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
