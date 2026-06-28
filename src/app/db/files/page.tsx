export const dynamic = "force-dynamic";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { ClearButton, SaveButton } from "./ClearButton";
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

  const newImageUrl = (formData.get("imageUrl") as string).trim();
  const newPdfUrl = (formData.get("pdfUrl") as string).trim();

  const updates: Promise<unknown>[] = [];

  if (newImageUrl) {
    const mapFields = { imageUrl: newImageUrl, updatedAt: now };
    updates.push(
      db.collection("config").doc("map").set(mapFields, { merge: true }),
      saveChangeLog({ operatorId: "db-admin", targetCollection: "config", targetId: "map", changeType: "update", changedFields: mapFields }),
    );
  }

  if (newPdfUrl) {
    const digitalFields = { pdfUrl: newPdfUrl, updatedAt: now };
    updates.push(
      db.collection("config").doc("digital").set(digitalFields, { merge: true }),
      saveChangeLog({ operatorId: "db-admin", targetCollection: "config", targetId: "digital", changeType: "update", changedFields: digitalFields }),
    );
  }

  await Promise.all(updates);
  revalidatePath("/db/files");
}

async function clearImageUrl() {
  "use server";
  const db = getDb();
  const now = nowTimestamp();
  const fields = { imageUrl: "", updatedAt: now };
  await db.collection("config").doc("map").set(fields, { merge: true });
  await saveChangeLog({ operatorId: "db-admin", targetCollection: "config", targetId: "map", changeType: "update", changedFields: fields });
  revalidatePath("/db/files");
}

async function clearPdfUrl() {
  "use server";
  const db = getDb();
  const now = nowTimestamp();
  const fields = { pdfUrl: "", updatedAt: now };
  await db.collection("config").doc("digital").set(fields, { merge: true });
  await saveChangeLog({ operatorId: "db-admin", targetCollection: "config", targetId: "digital", changeType: "update", changedFields: fields });
  revalidatePath("/db/files");
}

export default async function FilesPage() {
  const { map, digital } = await getFilesConfig();
  const hasError = map === null || digital === null;

  const currentImageUrl = (map?.imageUrl as string) ?? "";
  const currentPdfUrl = (digital?.pdfUrl as string) ?? "";

  if (hasError) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-bold">ファイル設定</h1>
        <p className="text-danger text-sm">Firebase未設定。</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">ファイル設定</h1>

      {/* 校舎マップ画像 */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold border-b pb-1">校舎マップ画像</h2>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-sub font-medium">現在の設定値</span>
          {currentImageUrl ? (
            <>
              <p className="text-sm text-text-main break-all">{currentImageUrl}</p>
              <div className="rounded-lg overflow-hidden border mt-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={currentImageUrl} alt="マッププレビュー" className="w-full h-auto max-h-48 object-contain bg-gray-50" />
              </div>
              <form action={clearImageUrl} className="mt-1">
                <ClearButton label="値をクリア" />
              </form>
            </>
          ) : (
            <p className="text-sm text-text-sub">未設定</p>
          )}
        </div>

        <form action={saveFiles} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">新しいURLに変更する場合</span>
            <input
              name="imageUrl"
              type="url"
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="https://..."
            />
            <input type="hidden" name="pdfUrl" value="" />
          </label>
          <SaveButton label="マップ画像を保存" />
        </form>
      </section>

      {/* デジタルパンフレット */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold border-b pb-1">デジタルパンフレット (PDF)</h2>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-sub font-medium">現在の設定値</span>
          {currentPdfUrl ? (
            <>
              <p className="text-sm text-text-main break-all">{currentPdfUrl}</p>
              <form action={clearPdfUrl} className="mt-1">
                <ClearButton label="値をクリア" />
              </form>
            </>
          ) : (
            <p className="text-sm text-text-sub">未設定</p>
          )}
        </div>

        <form action={saveFiles} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">新しいURLに変更する場合</span>
            <input
              name="pdfUrl"
              type="url"
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="https://..."
            />
            <input type="hidden" name="imageUrl" value="" />
          </label>
          <SaveButton label="PDFを保存" />
        </form>
      </section>

      <p className="text-xs text-text-sub">入力がない項目は変更されません。</p>
    </div>
  );
}
