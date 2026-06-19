"use client";

import Link from "next/link";

const STATUS_LABELS = ["停止中", "非常に閑散", "閑散", "通常", "混雑", "非常に混雑"];
const TYPE_LABELS: Record<string, string> = { car: "キッチンカー", pta: "PTAバザー" };

interface Item {
  boothId: string;
  shopName?: string;
  type?: string;
  status: number;
}

interface Props {
  items: Item[];
}

export function EatList({ items }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">飲食一覧</h1>
        <p className="text-xs text-text-sub">新規作成はブース管理から</p>
      </div>
      {items.length === 0 ? (
        <p className="text-text-sub text-sm">データがありません。ブース管理から飲食を追加してください。</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const displayName = item.shopName ?? item.boothId;
            return (
              <div key={item.boothId} className="bg-surface rounded-lg border p-4 flex items-start justify-between gap-4">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-background text-text-sub w-fit">
                    {TYPE_LABELS[item.type ?? ""] ?? item.type}
                  </span>
                  <p className="font-medium text-sm truncate">{displayName}</p>
                  <p className="text-xs">混雑: {STATUS_LABELS[item.status]}</p>
                </div>
                <Link href={`/db/eat/${item.boothId}`} className="text-xs px-3 py-1.5 rounded border border-primary text-primary shrink-0">
                  商品・インスタ編集
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
