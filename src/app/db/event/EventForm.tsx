"use client";

import { useState } from "react";
import { CalendarPicker } from "./CalendarPicker";

interface EventFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: {
    eventName?: string;
    day?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    details?: string;
    isDelayed?: boolean;
    delayMinutes?: number;
  };
  isEdit?: boolean;
}

export function EventForm({ action, defaultValues = {}, isEdit = false }: EventFormProps) {
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!confirm(isEdit ? "変更を保存しますか？" : "イベントを作成しますか？")) return;
    setPending(true);
    const fd = new FormData(e.currentTarget);
    await action(fd);
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">イベント名 <span className="text-danger">*</span></span>
        <input name="eventName" defaultValue={defaultValues.eventName ?? ""} required className="border rounded-lg px-3 py-2 text-sm" placeholder="例: 開会式" />
      </label>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">開催日 <span className="text-danger">*</span></span>
        <CalendarPicker name="day" defaultValue={defaultValues.day ?? "2026-09-07"} required />
      </div>

      <div className="flex gap-3">
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-sm font-medium">開始時刻 <span className="text-danger">*</span></span>
          <input name="startTime" type="time" defaultValue={defaultValues.startTime ?? ""} required className="border rounded-lg px-3 py-2 text-sm" step="1" />
        </label>
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-sm font-medium">終了時刻 <span className="text-danger">*</span></span>
          <input name="endTime" type="time" defaultValue={defaultValues.endTime ?? ""} required className="border rounded-lg px-3 py-2 text-sm" step="1" />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">場所 <span className="text-danger">*</span></span>
        <input name="location" defaultValue={defaultValues.location ?? ""} required className="border rounded-lg px-3 py-2 text-sm" placeholder="例: 体育館" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">詳細</span>
        <textarea name="details" defaultValue={defaultValues.details ?? ""} rows={3} className="border rounded-lg px-3 py-2 text-sm resize-none" />
      </label>

      {isEdit && (
        <>
          <label className="flex items-center gap-2 cursor-pointer">
            <input name="isDelayed" type="checkbox" value="true" defaultChecked={defaultValues.isDelayed} className="rounded" />
            <span className="text-sm font-medium">遅延あり</span>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">遅延分数</span>
            <input name="delayMinutes" type="number" min={0} defaultValue={defaultValues.delayMinutes ?? 0} className="border rounded-lg px-3 py-2 text-sm" />
          </label>
        </>
      )}

      <div className="flex gap-3 mt-2">
        <a href="/db/event" className="flex-1 text-center py-2 rounded-lg border text-sm">キャンセル</a>
        <button type="submit" disabled={pending} className="flex-1 py-2 rounded-lg bg-primary text-white font-bold text-sm disabled:opacity-60">
          {pending ? "保存中…" : isEdit ? "保存" : "作成"}
        </button>
      </div>
    </form>
  );
}
