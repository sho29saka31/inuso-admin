export const dynamic = "force-dynamic";
import Link from "next/link";
import { getDb } from "@/lib/firebase-admin";
import { getAdminScope } from "@/lib/admin-auth";
import { isFullAccess, getScopeLabel } from "@/lib/admin-scope";

const STATUS_LABELS = ["停止中", "非常に閑散", "閑散", "通常", "混雑", "非常に混雑"];
const STATUS_COLORS = [
  "bg-gray-100 text-gray-600",
  "bg-blue-50 text-blue-600",
  "bg-green-50 text-green-600",
  "bg-yellow-50 text-yellow-700",
  "bg-orange-50 text-orange-600",
  "bg-red-50 text-red-600",
];

const SCOPE_TO_BOOTH_ID: Record<string, string> = {
  "1-1": "class1-1", "1-2": "class1-2", "1-3": "class1-3", "1-4": "class1-4",
  "2-1": "class2-1", "2-2": "class2-2", "2-3": "class2-3", "2-4": "class2-4",
  "3-1": "class3-1", "3-2": "class3-2", "3-3": "class3-3", "3-4": "class3-4",
  "eスポーツ部": "club-game",
  "美術部": "club-art",
  "有志発表": "pe-gym",
};

function boothMatchesScope(booth: Record<string, unknown>, scope: string): boolean {
  if (isFullAccess(scope)) return true;
  if (scope === "キッチンカー") return (booth.type as string) === "car";
  if (scope === "PTAバザー") return (booth.type as string) === "pta";
  const targetId = SCOPE_TO_BOOTH_ID[scope];
  if (targetId) return (booth.boothId as string) === targetId;
  return false;
}

async function getBooths(scope: string) {
  try {
    const db = getDb();
    const snap = await db.collection("booths").get();
    const all = snap.docs.map((d) => ({ boothId: d.id, ...(d.data() as Record<string, unknown>) }));
    return isFullAccess(scope) ? all : all.filter((b) => boothMatchesScope(b, scope));
  } catch {
    return null;
  }
}

export default async function AdminMyBoothPage() {
  const scope = await getAdminScope();

  if (!scope) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold">マイブース</h1>
        <p className="text-sm text-text-sub">
          所属が設定されていません。一度ログアウトして再度ログインしてください。
        </p>
      </div>
    );
  }

  const booths = await getBooths(scope);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">マイブース</h1>
        <p className="text-xs text-text-sub mt-0.5">所属: {getScopeLabel(scope)}</p>
      </div>

      {booths === null ? (
        <p className="text-danger text-sm">Firebase未設定。</p>
      ) : booths.length === 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-text-sub text-sm">担当ブースが見つかりません。</p>
          {isFullAccess(scope) && (
            <Link href="/admin/booth" className="text-sm text-primary underline">
              全ブース一覧を見る
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {booths.map((b) => {
            const isEat = b.category === "eat";
            const editPath = isEat
              ? `/admin/eat/${b.boothId}`
              : `/admin/booth/${b.boothId}`;
            return (
              <div
                key={b.boothId as string}
                className="bg-white rounded-xl border p-4 flex items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="font-medium text-sm truncate">
                    {(b.name ?? b.shopName) as string}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        STATUS_COLORS[b.status as number] ?? STATUS_COLORS[3]
                      }`}
                    >
                      {STATUS_LABELS[b.status as number] ?? b.status}
                    </span>
                    <span className="text-xs text-text-sub">待ち {b.waitCount as number}組</span>
                    {(b.updatedAt as Record<string, string>)?.display && (
                      <span className="text-xs text-text-sub">
                        {(b.updatedAt as Record<string, string>).display}
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  href={editPath}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-primary text-primary font-medium"
                >
                  編集
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
