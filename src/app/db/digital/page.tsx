import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { saveChangeLog } from "@/lib/changelog";
import { revalidatePath } from "next/cache";

async function getDigital(): Promise<Record<string, unknown> | null> {
  try {
    const db = getDb();
    const snap = await db.collection("config").doc("digital").get();
    return snap.exists ? (snap.data() as Record<string, unknown>) : {};
  } catch {
    return null;
  }
}

async function saveDigital(formData: FormData) {
  "use server";
  const db = getDb();
  const now = nowTimestamp();
  const fields = {
    pdfUrl: formData.get("pdfUrl") as string,
    updatedAt: now,
  };
  await db.collection("config").doc("digital").set(fields, { merge: true });
  await saveChangeLog({
    operatorId: "db-admin",
    targetCollection: "config",
    targetId: "digital",
    changeType: "update",
    changedFields: fields,
  });
  revalidatePath("/db/digital");
}

export default async function DigitalPage() {
  const data = await getDigital();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">デジタルパンフレット</h1>

      {data === null ? (
        <p className="text-danger text-sm">Firebase未設定。</p>
      ) : (
        <form action={saveDigital} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">PDF URL <span className="text-danger">*</span></span>
            <input
              name="pdfUrl"
              type="url"
              defaultValue={(data.pdfUrl as string) ?? ""}
              required
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="https://..."
            />
          </label>

          {data.pdfUrl && (
            <div className="bg-surface border rounded-lg p-3 text-xs text-text-sub break-all">
              現在: {data.pdfUrl as string}
            </div>
          )}

          {data.updatedAt && (
            <p className="text-xs text-text-sub">最終更新: {(data.updatedAt as { display: string }).display}</p>
          )}

          <button type="submit" className="py-2 rounded-lg bg-primary text-white font-bold text-sm">
            保存
          </button>
        </form>
      )}
    </div>
  );
}
