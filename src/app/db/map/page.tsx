export const dynamic = "force-dynamic";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { saveChangeLog } from "@/lib/changelog";
import { revalidatePath } from "next/cache";

async function getMap(): Promise<Record<string, unknown> | null> {
  try {
    const db = getDb();
    const snap = await db.collection("config").doc("map").get();
    return snap.exists ? (snap.data() as Record<string, unknown>) : {};
  } catch {
    return null;
  }
}

async function saveMap(formData: FormData) {
  "use server";
  const db = getDb();
  const now = nowTimestamp();
  const fields = {
    imageUrl: formData.get("imageUrl") as string,
    updatedAt: now,
  };
  await db.collection("config").doc("map").set(fields, { merge: true });
  await saveChangeLog({
    operatorId: "db-admin",
    targetCollection: "config",
    targetId: "map",
    changeType: "update",
    changedFields: fields,
  });
  revalidatePath("/db/map");
}

export default async function MapAdminPage() {
  const data = await getMap();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">校内マップ設定</h1>

      {data === null ? (
        <p className="text-danger text-sm">Firebase未設定。</p>
      ) : (
        <form action={saveMap} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">マップ画像URL</span>
            <input
              name="imageUrl"
              type="url"
              defaultValue={(data.imageUrl as string) ?? ""}
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="https://..."
            />
          </label>

          {!!data.imageUrl && (
            <div className="rounded-lg overflow-hidden border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.imageUrl as string} alt="マッププレビュー" className="w-full h-auto" />
            </div>
          )}

          <button type="submit" className="py-2 rounded-lg bg-primary text-white font-bold text-sm">
            保存
          </button>
        </form>
      )}
    </div>
  );
}
