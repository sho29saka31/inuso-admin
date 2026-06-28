export const dynamic = "force-dynamic";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { saveChangeLog } from "@/lib/changelog";
import { verifySession } from "@/lib/auth";
import { revalidateViewer } from "@/lib/revalidate";

interface Features {
  [key: string]: boolean;
}

async function getFeaturesDoc(docId: string): Promise<Features> {
  try {
    const snap = await getDb().collection("config").doc(docId).get();
    return snap.exists ? (snap.data() as Features) : {};
  } catch {
    return {};
  }
}

async function saveFeatures(docId: string, formData: FormData, keys: string[]) {
  "use server";
  if (!await verifySession()) throw new Error("Unauthorized");
  const db = getDb();
  const now = nowTimestamp();
  const fields: Features = { updatedAt: now as unknown as boolean };
  for (const key of keys) {
    fields[key] = formData.get(key) === "on";
  }
  await db.collection("config").doc(docId).set(fields, { merge: true });
  await saveChangeLog({
    operatorId: "db-admin",
    targetCollection: "config",
    targetId: docId,
    changeType: "update",
    changedFields: fields as unknown as Record<string, unknown>,
  });
  if (docId === "viewer_features") {
    await revalidateViewer(["/", "/event", "/booth", "/busy", "/eat", "/notice", "/digital", "/map"]);
  }
  revalidatePath("/db/features");
}

const VIEWER_KEYS = ["event", "booth", "busy", "eat", "notice", "digital", "map"];
const VIEWER_LABELS: Record<string, string> = {
  event: "イベントスケジュール",
  booth: "ブース一覧",
  busy: "混雑状況",
  eat: "飲食エリア",
  notice: "お知らせ",
  digital: "デジタルパンフレット",
  map: "校内マップ",
};

const ADMIN_KEYS = ["notice", "booth", "event", "eat"];
const ADMIN_LABELS: Record<string, string> = {
  notice: "お知らせ管理",
  booth: "ブース管理",
  event: "イベント管理",
  eat: "飲食ブース管理",
};

export default async function FeaturesPage() {
  const [viewerFeatures, adminFeatures] = await Promise.all([
    getFeaturesDoc("viewer_features"),
    getFeaturesDoc("admin_features"),
  ]);

  async function saveViewerFeatures(formData: FormData) {
    "use server";
    await saveFeatures("viewer_features", formData, VIEWER_KEYS);
  }

  async function saveAdminFeatures(formData: FormData) {
    "use server";
    await saveFeatures("admin_features", formData, ADMIN_KEYS);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">機能ON/OFF設定</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold border-b pb-1">Viewer（一般公開）機能</h2>
        <form action={saveViewerFeatures} className="flex flex-col gap-3">
          {VIEWER_KEYS.map((key) => {
            const enabled = viewerFeatures[key] !== false;
            return (
              <label key={key} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <span className="text-sm">{VIEWER_LABELS[key]}</span>
                <input
                  type="checkbox"
                  name={key}
                  defaultChecked={enabled}
                  className="w-5 h-5 accent-primary"
                />
              </label>
            );
          })}
          <button type="submit" className="w-full py-2 rounded-lg bg-primary text-white font-bold text-sm mt-1">
            Viewer設定を保存
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold border-b pb-1">Admin（運営）機能</h2>
        <form action={saveAdminFeatures} className="flex flex-col gap-3">
          {ADMIN_KEYS.map((key) => {
            const enabled = adminFeatures[key] !== false;
            return (
              <label key={key} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <span className="text-sm">{ADMIN_LABELS[key]}</span>
                <input
                  type="checkbox"
                  name={key}
                  defaultChecked={enabled}
                  className="w-5 h-5 accent-primary"
                />
              </label>
            );
          })}
          <button type="submit" className="w-full py-2 rounded-lg bg-primary text-white font-bold text-sm mt-1">
            Admin設定を保存
          </button>
        </form>
      </section>

      <p className="text-xs text-text-sub">チェックをOFFにするとメニューから非表示になり、直接アクセスしても利用できなくなります。</p>
    </div>
  );
}
