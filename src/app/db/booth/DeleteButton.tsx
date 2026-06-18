"use client";

interface Props {
  boothId: string;
  name: string;
  action: (id: string) => Promise<void>;
}

export function DeleteButton({ boothId, name, action }: Props) {
  async function handleClick() {
    if (!confirm(`「${name}」を削除しますか？この操作は取り消せません。`)) return;
    await action(boothId);
  }
  return (
    <button
      onClick={handleClick}
      className="text-xs px-3 py-1.5 rounded border border-danger text-danger"
    >
      削除
    </button>
  );
}
