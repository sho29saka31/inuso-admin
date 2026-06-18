"use client";

interface Props {
  eventId: string;
  name: string;
  action: (id: string) => Promise<void>;
}

export function DeleteButton({ eventId, name, action }: Props) {
  async function handleClick() {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    await action(eventId);
  }
  return (
    <button onClick={handleClick} className="text-xs px-3 py-1.5 rounded border border-danger text-danger">
      削除
    </button>
  );
}
