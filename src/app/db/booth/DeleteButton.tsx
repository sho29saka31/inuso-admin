"use client";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useConfirm } from "@/hooks/useConfirm";

interface Props {
  boothId: string;
  name: string;
  action: (id: string) => Promise<void>;
}

export function DeleteButton({ boothId, name, action }: Props) {
  const { confirm, confirmState, handleResult } = useConfirm();

  async function handleClick() {
    const ok = await confirm(`「${name}」を削除しますか？この操作は取り消せません。`); if (!ok) return;
    await action(boothId);
  }
  return (
    <>
      <button
        onClick={handleClick}
        className="text-xs px-3 py-1.5 rounded border border-danger text-danger"
      >
        削除
      </button>
      {confirmState && <ConfirmDialog message={confirmState.message} onConfirm={() => handleResult(true)} onCancel={() => handleResult(false)} />}
    </>
  );
}
