export const dynamic = "force-dynamic";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { saveChangeLog } from "@/lib/changelog";
import { revalidatePath } from "next/cache";

interface BluetoothConfig {
  enabled: boolean;
  scanIntervalSeconds: number;
  staleness: {
    warnMinutes: number;
    alertMinutes: number;
  };
}

async function getConfig(): Promise<BluetoothConfig | null | "error"> {
  try {
    const db = getDb();
    const snap = await db.collection("config").doc("bluetooth").get();
    if (!snap.exists) {
      return { enabled: true, scanIntervalSeconds: 30, staleness: { warnMinutes: 5, alertMinutes: 10 } };
    }
    return snap.data() as BluetoothConfig;
  } catch {
    return "error";
  }
}

async function saveConfig(formData: FormData) {
  "use server";
  const db = getDb();
  const now = nowTimestamp();
  const fields: BluetoothConfig = {
    enabled: formData.get("enabled") === "true",
    scanIntervalSeconds: Number(formData.get("scanIntervalSeconds")),
    staleness: {
      warnMinutes: Number(formData.get("warnMinutes")),
      alertMinutes: Number(formData.get("alertMinutes")),
    },
  };
  await db.collection("config").doc("bluetooth").set({ ...fields, updatedAt: now }, { merge: true });
  await saveChangeLog({
    operatorId: "db-admin",
    targetCollection: "config",
    targetId: "bluetooth",
    changeType: "update",
    changedFields: fields as unknown as Record<string, unknown>,
  });
  revalidatePath("/db/config");
}

export default async function ConfigPage() {
  const config = await getConfig();

  if (config === "error") {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold">システム設定</h1>
        <p className="text-danger text-sm">Firebase未設定。</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">システム設定</h1>

      <form action={saveConfig} className="flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-text-sub uppercase tracking-wide">Bluetooth</h2>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">スキャン有効</span>
            <select name="enabled" defaultValue={config?.enabled ? "true" : "false"} className="border rounded-lg px-3 py-2 text-sm">
              <option value="true">有効</option>
              <option value="false">無効</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">スキャン間隔（秒）</span>
            <input
              name="scanIntervalSeconds"
              type="number"
              min={5}
              max={300}
              defaultValue={config?.scanIntervalSeconds ?? 30}
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </label>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-text-sub uppercase tracking-wide">陳腐化しきい値</h2>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">警告（分）</span>
            <input
              name="warnMinutes"
              type="number"
              min={1}
              defaultValue={config?.staleness?.warnMinutes ?? 5}
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">アラート（分）</span>
            <input
              name="alertMinutes"
              type="number"
              min={1}
              defaultValue={config?.staleness?.alertMinutes ?? 10}
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </label>
        </section>

        <button type="submit" className="py-2 rounded-lg bg-primary text-white font-bold text-sm">
          保存
        </button>
      </form>
    </div>
  );
}
