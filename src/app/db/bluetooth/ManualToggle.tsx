"use client";

import { useTransition } from "react";
import { setBoothManual } from "./actions";

export function ManualToggle({ boothId, isManual }: { boothId: string; isManual: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await setBoothManual(boothId, !isManual);
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 disabled:opacity-50 ${
        isManual ? "bg-primary" : "bg-gray-200"
      }`}
      role="switch"
      aria-checked={isManual}
      aria-label={isManual ? "手動モード（タップで自動に切替）" : "自動モード（タップで手動に切替）"}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
          isManual ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
