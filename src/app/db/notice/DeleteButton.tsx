"use client";

interface DeleteButtonProps {
  noticeId: string;
  title: string;
  action: (noticeId: string) => Promise<void>;
}

export function DeleteButton({ noticeId, title, action }: DeleteButtonProps) {
  async function handleClick() {
    if (!confirm(`「${title}」を削除しますか？`)) return;
    await action(noticeId);
  }

  return (
    <button onClick={handleClick} className="text-xs px-3 py-1.5 rounded border border-danger text-danger">
      削除
    </button>
  );
}
