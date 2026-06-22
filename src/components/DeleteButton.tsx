"use client";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useConfirm } from "@/hooks/useConfirm";

interface Props {
  id: string;
  label: string;
  confirmMessage: string;
  action: (id: string) => Promise<void>;
}

export function DeleteButton({ id, label, confirmMessage, action }: Props) {
  const { confirm, confirmState, handleResult } = useConfirm();

  async function handleClick() {
    const ok = await confirm(confirmMessage);
    if (!ok) return;
    await action(id);
  }

  return (
    <>
      <button onClick={handleClick} className="text-xs px-3 py-1.5 rounded border border-danger text-danger">
        {label}
      </button>
      {confirmState && (
        <ConfirmDialog
          message={confirmState.message}
          onConfirm={() => handleResult(true)}
          onCancel={() => handleResult(false)}
        />
      )}
    </>
  );
}
