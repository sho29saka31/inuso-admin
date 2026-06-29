export const dynamic = "force-dynamic";
import { getDb } from "@/lib/firebase-admin";
import { setBulkManual } from "./actions";
import { ManualToggle } from "./ManualToggle";

async function getBooths() {
  try {
    const db = getDb();
    const snap = await db.collection("booths").orderBy("boothId").get();
    return snap.docs.map((d) => d.data());
  } catch {
    return null;
  }
}

export default async function BluetoothPage() {
  const booths = await getBooths();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Bluetooth管理</h1>
        <div className="flex gap-2">
          <form action={setBulkManual.bind(null, true)}>
            <button
              type="submit"
              className="text-xs px-3 py-1.5 rounded-lg border border-primary text-primary font-medium"
            >
              全て手動
            </button>
          </form>
          <form action={setBulkManual.bind(null, false)}>
            <button
              type="submit"
              className="text-xs px-3 py-1.5 rounded-lg bg-primary text-white font-medium"
            >
              全て自動
            </button>
          </form>
        </div>
      </div>

      <p className="text-xs text-text-sub">
        手動モードON：Bluetooth自動更新を無効化。手動モードOFF：Bluetoothで自動更新。
      </p>

      {booths === null ? (
        <p className="text-danger text-sm">Firebase未設定。環境変数を確認してください。</p>
      ) : booths.length === 0 ? (
        <p className="text-text-sub text-sm">ブースがありません。</p>
      ) : (
        <div className="flex flex-col gap-2">
          {booths.map((b) => {
            const lastBt = (b.lastBluetoothAt as Record<string, string> | undefined)?.display;
            return (
              <div
                key={b.boothId as string}
                className="bg-surface rounded-lg border p-4 flex items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="font-medium text-sm truncate">{(b.name ?? b.shopName) as string}</span>
                  <span className="text-xs text-text-sub">{b.boothId as string}</span>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      b.isManual ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-600"
                    }`}>
                      {b.isManual ? "手動" : "自動"}
                    </span>
                    {typeof b.deviceCount === "number" && (
                      <span className="text-xs text-text-sub">端末数: {b.deviceCount as number}</span>
                    )}
                    {lastBt && (
                      <span className="text-xs text-text-sub">最終受信: {lastBt}</span>
                    )}
                  </div>
                </div>
                <ManualToggle boothId={b.boothId as string} isManual={Boolean(b.isManual)} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
