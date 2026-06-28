"use client";
import { useFormStatus } from "react-dom";

export function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2 rounded-lg bg-primary text-white font-bold text-sm mt-1 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
    >
      {pending ? "保存中…" : label}
    </button>
  );
}
