export const dynamic = "force-dynamic";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { saveChangeLog } from "@/lib/changelog";
import { revalidatePath } from "next/cache";

async function getFilesConfig(): Promise<{ map: Record<string, unknown> | null; digital: Record<string, unknown> | null }> {
  try {
    const db = getDb();
    const [mapSnap, digitalSnap] = await Promise.all([
      db.collection("config").doc("map").get(),
      db.collection("config").doc("digital").get(),
    ]);
    return {
      map: mapSnap.exists ? (mapSnap.data() as Record<string, unknown>) : {},
      digital: digitalSnap.exists ? (digitalSnap.data() as Record<string, unknown>) : {},
    };
  } catch {
    return { map: null, digital: null };
  }
}

async function saveFiles(formData: FormData) {
  "use server";
  const db = getDb();
  const now = nowTimestamp();

  const mapFields = { imageUrl: formData.get("imageUrl") as string, updatedAt: now };
  const digitalFields = { pdfUrl: formData.get("pdfUrl") as string, updatedAt: now };

  await Promise.all([
    db.collection("config").doc("map").set(mapFields, { merge: true }),
    db.collection("config").doc("digital").set(digitalFields, { merge: true }),
  ]);

  await Promise.all([
    saveChangeLog({ operatorId: "db-admin", targetCollection: "config", targetId: "map", changeType: "update", changedFields: mapFields }),
    saveChangeLog({ operatorId: "db-admin", targetCollection: "config", targetId: "digital", changeType: "update", changedFields: digitalFields }),
  ]);

  revalidatePath("/db/files");
}

export default async function FilesPage() {
  const { map, digital } = await getFilesConfig();
  const hasError = map === null || digital === null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">ファイル設定</h1>

      {hasError ? (
        <p className="text-danger text-sm">Firebase未設定。</p>
      ) : (
        <form action={saveFiles} className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold border-b pb-1">校舎マップ画像</h2>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">マップ画像URL</span>
              <input
                name="imageUrl"
                type="url"
                defaultValue={(map!.imageUrl as string) ?? ""}
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="https://..."
              />
            </label>
            {!!(map!.imageUrl) && (
              <div className="rounded-lg overflow-hidden border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={map!.imageUrl as string} alt="マッププレビュー" className="w-full h-auto max-h-48 object-contain bg-gray-50" />
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold border-b pb-1">デジタルパンフレット (PDF)</h2>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">PDF URL</span>
              <input
                name="pdfUrl"
                type="url"
                defaultValue={(digital!.pdfUrl as string) ?? ""}
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="https://..."
              />
            </label>
            {!!(digital!.pdfUrl) && (
              <div className="bg-surface border rounded-lg p-3 text-xs text-text-sub break-all">
                現在: {String(digital!.pdfUrl)}
              </div>
            )}
          </section>

          <button type="submit" className="w-full py-2.5 rounded-lg bg-primary text-white font-bold text-sm">
            保存
          </button>
        </form>
      )}
    </div>
  );
}
