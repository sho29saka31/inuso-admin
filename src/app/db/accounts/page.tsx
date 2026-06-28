export const dynamic = "force-dynamic";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { saveChangeLog } from "@/lib/changelog";
import { verifySession } from "@/lib/auth";

async function getAccountStatuses(): Promise<Record<string, boolean>> {
  try {
    const snap = await getDb().collection("config").doc("admin_accounts").get();
    if (!snap.exists) return {};
    const data = snap.data() ?? {};
    const result: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === "boolean") result[k] = v;
    }
    return result;
  } catch {
    return {};
  }
}

function getDefinedScopes(): string[] {
  const raw = process.env.ADMIN_PASSWORDS;
  if (!raw) return [];
  try {
    return Object.keys(JSON.parse(raw) as Record<string, string>);
  } catch {
    return [];
  }
}

async function toggleAccount(formData: FormData) {
  "use server";
  if (!await verifySession()) throw new Error("Unauthorized");
  const scope = formData.get("scope") as string;
  const enabled = formData.get("enabled") === "true";
  if (!scope) return;
  const db = getDb();
  await db.collection("config").doc("admin_accounts").set({ [scope]: enabled }, { merge: true });
  await saveChangeLog({
    operatorId: "db-admin",
    targetCollection: "config",
    targetId: "admin_accounts",
    changeType: "update",
    changedFields: { [scope]: enabled },
  });
  revalidatePath("/db/accounts");
}

async function bulkToggle(formData: FormData) {
  "use server";
  if (!await verifySession()) throw new Error("Unauthorized");
  const enabled = formData.get("enabled") === "true";
  const raw = process.env.ADMIN_PASSWORDS;
  if (!raw) return;
  let scopes: string[];
  try {
    scopes = Object.keys(JSON.parse(raw) as Record<string, string>);
  } catch {
    return;
  }
  const db = getDb();
  const fields: Record<string, boolean> = {};
  for (const scope of scopes) fields[scope] = enabled;
  await db.collection("config").doc("admin_accounts").set(fields, { merge: true });
  await saveChangeLog({
    operatorId: "db-admin",
    targetCollection: "config",
    targetId: "admin_accounts",
    changeType: "update",
    changedFields: fields,
  });
  revalidatePath("/db/accounts");
}

export default async function AccountsPage() {
  const [statuses, scopes] = await Promise.all([
    getAccountStatuses(),
    Promise.resolve(getDefinedScopes()),
  ]);

  if (scopes.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold">アカウント管理</h1>
        <p className="text-sm text-text-sub">ADMIN_PASSWORDS 環境変数が設定されていません。</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">アカウント管理</h1>
      <p className="text-xs text-text-sub">OFFにすると、そのスコープでのログインが拒否されます。</p>

      {/* 一括制御 */}
      <div className="flex gap-2">
        <form action={bulkToggle} className="flex-1">
          <input type="hidden" name="enabled" value="true" />
          <button type="submit" className="w-full py-1.5 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary hover:text-white transition-colors">
            全てON
          </button>
        </form>
        <form action={bulkToggle} className="flex-1">
          <input type="hidden" name="enabled" value="false" />
          <button type="submit" className="w-full py-1.5 rounded-lg border border-danger text-danger text-sm font-medium hover:bg-danger hover:text-white transition-colors">
            全てOFF
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-0 border rounded-lg overflow-hidden">
        {scopes.map((scope) => {
          const enabled = statuses[scope] !== false;
          return (
            <div key={scope} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 bg-white">
              <span className="text-sm font-medium">{scope}</span>
              <form action={toggleAccount}>
                <input type="hidden" name="scope" value={scope} />
                <input type="hidden" name="enabled" value={enabled ? "false" : "true"} />
                <button
                  type="submit"
                  aria-label={enabled ? "OFFにする" : "ONにする"}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                  style={{ backgroundColor: enabled ? "var(--color-primary, #1EA78C)" : "#D1D5DB" }}
                >
                  <span
                    className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
                    style={{ transform: enabled ? "translateX(1.375rem)" : "translateX(0.25rem)" }}
                  />
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
