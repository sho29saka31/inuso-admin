import Link from "next/link";
import { getDb } from "@/lib/firebase-admin";
import { deleteBooth } from "./actions";
import { DeleteButton } from "./DeleteButton";

const STATUS_LABELS = ["停止中", "非常に閑散", "閑散", "通常", "混雑", "非常に混雑"];

async function getBooths() {
  try {
    const db = getDb();
    const snap = await db.collection("booths").orderBy("boothId").get();
    return snap.docs.map((d) => d.data());
  } catch {
    return null;
  }
}

export default async function BoothListPage() {
  const booths = await getBooths();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">ブース一覧</h1>
        <Link
          href="/db/booth/new"
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + 新規作成
        </Link>
      </div>

      {booths === null ? (
        <p className="text-danger text-sm">Firebase未設定。環境変数を確認してください。</p>
      ) : booths.length === 0 ? (
        <p className="text-text-sub text-sm">ブースがありません。新規作成してください。</p>
      ) : (
        <div className="flex flex-col gap-2">
          {booths.map((b) => (
            <div
              key={b.boothId}
              className="bg-surface rounded-lg border p-4 flex items-start justify-between gap-4"
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium text-sm">{b.name}</span>
                <span className="text-xs text-text-sub">{b.boothId} / {b.location}</span>
                <span className="text-xs">
                  状態:{" "}
                  <span className="font-medium">{STATUS_LABELS[b.status] ?? b.status}</span>
                  {" "}｜ 待ち: {b.waitCount}組
                </span>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/db/booth/${b.boothId}`}
                  className="text-xs px-3 py-1.5 rounded border border-primary text-primary"
                >
                  編集
                </Link>
                <DeleteButton boothId={b.boothId} name={b.name} action={deleteBooth} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
