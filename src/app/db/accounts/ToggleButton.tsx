"use client";
import { useFormStatus } from "react-dom";

export function ToggleButton({ enabled }: { enabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      aria-label={enabled ? "OFFにする" : "ONにする"}
      disabled={pending}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ backgroundColor: enabled ? "var(--color-primary, #1EA78C)" : "#D1D5DB" }}
    >
      <span
        className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
        style={{ transform: enabled ? "translateX(1.375rem)" : "translateX(0.25rem)" }}
      />
    </button>
  );
}

export function BulkButton({ label, danger }: { label: string; danger?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full py-1.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        danger
          ? "border-danger text-danger hover:bg-danger hover:text-white"
          : "border-primary text-primary hover:bg-primary hover:text-white"
      }`}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
          </svg>
          処理中…
        </span>
      ) : label}
    </button>
  );
}
