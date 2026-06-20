"use client";

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ message, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-6" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-xs rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-text-main leading-relaxed whitespace-pre-line mb-5">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium text-text-sub"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg bg-primary text-sm font-bold text-white"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
