export const dynamic = "force-dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/firebase-admin";
import { getAdminScope } from "@/lib/admin-auth";
import { isFullAccess } from "@/lib/admin-scope";
import { getAdminFeatures } from "@/lib/feature-flags";
import FeatureDisabled from "@/components/FeatureDisabled";

const STATUS_LABELS = ["停止中", "非常に閑散", "閑散", "通常", "混雑", "非常に混雑"];
const STATUS_COLORS = [
  "bg-gray-100 text-gray-600",
  "bg-blue-50 text-blue-600",
  "bg-green-50 text-green-600",
  "bg-yellow-50 text-yellow-700",
  "bg-orange-50 text-orange-600",
  "bg-red-50 text-red-600",
];

async function getBooths() {
  try {
    const db = getDb();
    const snap = await db.collection("booths").get();
    return snap.docs
      .map((d) => { const data = d.data(); if (!data.boothId) data.boothId = d.id; return data; })
      .sort((a, b) => String(a.boothId ?? "").localeCompare(String(b.boothId ?? "")));
  } catch {
    return null;
  }
}

export default async function AdminBoothPage() {
  if (!(await getAdminFeatures()).booth) return <FeatureDisabled />;
  const scope = await getAdminScope();
  // 限定アクセスユーザーはマイブースへリダイレクト（全ブース閲覧不可）
  if (!scope || !isFullAccess(scope)) {
    redirect("/admin/mybooth");
  }

  const booths = await getBooths();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">ブース一覧</h1>

      {booths === null ? (
        <p className="text-danger text-sm">Firebase未設定。</p>
      ) : booths.length === 0 ? (
        <p className="text-text-sub text-sm">ブースがありません。</p>
      ) : (
        <div className="flex flex-col gap-2">
          {booths.map((b) => (
            <div
              key={b.boothId}
              className="bg-white rounded-xl border p-4 flex items-center justify-between gap-4"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <span className="font-medium text-sm truncate">{b.name ?? b.shopName}</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      STATUS_COLORS[b.status] ?? STATUS_COLORS[3]
                    }`}
                  >
                    {STATUS_LABELS[b.status] ?? b.status}
                  </span>
                  <span className="text-xs text-text-sub">待ち {b.waitCount}組</span>
                  {b.updatedAt?.display && (
                    <span className="text-xs text-text-sub">{b.updatedAt.display}</span>
                  )}
                </div>
              </div>
              <Link
                href={`/admin/booth/${b.boothId}`}
                className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-primary text-primary font-medium"
              >
                編集
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
