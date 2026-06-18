"use client";

import Link from "next/link";
import { deleteEatItem } from "./actions";

const STATUS_LABELS = ["停止中", "非常に閑散", "閑散", "通常", "混雑", "非常に混雑"];

interface Item {
  boothId: string;
  name: string;
  location: string;
  status: number;
}

interface Props {
  items: Item[];
  type: "car" | "pta";
  title: string;
}

export function EatList({ items, type, title }: Props) {
  async function handleDelete(boothId: string, name: string) {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    await deleteEatItem(boothId, type);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{title}</h1>
        <Link href={`/db/eat/${type}/new`} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium">
          + 新規作成
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-text-sub text-sm">データがありません。</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div key={item.boothId} className="bg-surface rounded-lg border p-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-xs text-text-sub">{item.location}</p>
                <p className="text-xs">状態: {STATUS_LABELS[item.status]}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link href={`/db/eat/${type}/${item.boothId}`} className="text-xs px-3 py-1.5 rounded border border-primary text-primary">
                  編集
                </Link>
                <button onClick={() => handleDelete(item.boothId, item.name)} className="text-xs px-3 py-1.5 rounded border border-danger text-danger">
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
