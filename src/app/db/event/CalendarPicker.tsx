"use client";

import { useState } from "react";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function isoToDate(iso: string): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

interface CalendarPickerProps {
  name: string;
  defaultValue?: string;
  required?: boolean;
}

export function CalendarPicker({ name, defaultValue = "", required }: CalendarPickerProps) {
  const initial = isoToDate(defaultValue) ?? new Date(2026, 8, 7);
  const [selected, setSelected] = useState<Date | null>(isoToDate(defaultValue));
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function isSelected(day: number) {
    if (!selected) return false;
    return selected.getFullYear() === viewYear && selected.getMonth() === viewMonth && selected.getDate() === day;
  }

  const today = new Date();
  function isToday(day: number) {
    return today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={selected ? dateToIso(selected) : ""} required={required} />

      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-primary text-white px-3 py-2">
          <button type="button" onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/20">
            ‹
          </button>
          <span className="font-bold text-sm">
            {viewYear}年 {viewMonth + 1}月
          </span>
          <button type="button" onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/20">
            ›
          </button>
        </div>

        {/* Weekday labels */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={`text-center text-xs py-1 font-medium ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"}`}
            >
              {w}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            const col = idx % 7;
            if (!day) return <div key={idx} className="py-2" />;
            const sel = isSelected(day);
            const tod = isToday(day);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelected(new Date(viewYear, viewMonth, day))}
                className={`py-2 text-sm font-medium transition-colors relative
                  ${sel ? "bg-primary text-white" : tod ? "text-primary font-bold" : "hover:bg-gray-100"}
                  ${col === 0 && !sel ? "text-red-500" : col === 6 && !sel ? "text-blue-500" : ""}
                `}
              >
                {day}
                {tod && !sel && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <p className="text-sm text-gray-600 text-center">
          選択中: <strong>{viewYear}年 {selected.getMonth() + 1}月 {selected.getDate()}日 ({WEEKDAYS[selected.getDay()]})</strong>
        </p>
      )}
    </div>
  );
}
