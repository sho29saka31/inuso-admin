"use client";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useConfirm } from "@/hooks/useConfirm";

interface DeleteButtonProps {
  noticeId: string;
  title: string;
  action: (noticeId: string) => Promise<void>;
}

export function DeleteButton({ noticeId, title, action }: DeleteButtonProps) {
  const { confirm, confirmState, handleResult } = useConfirm();

  async function handleClick() {
    const ok = await confirm(`「${title}」を削除しますか？`); if (!ok) return;
    await action(noticeId);
  }

  return (
    <>
      <button onClick={handleClick} className="text-xs px-3 py-1.5 rounded border border-danger text-danger">
        削除
      </button>
      {confirmState && <ConfirmDialog message={confirmState.message} onConfirm={() => handleResult(true)} onCancel={() => handleResult(false)} />}
    </>
  );
}
