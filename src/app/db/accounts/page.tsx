export const dynamic = "force-dynamic";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { saveChangeLog } from "@/lib/changelog";
import { verifySession } from "@/lib/auth";
import { getScopeLabel } from "@/lib/admin-scope";
import { ToggleButton, BulkButton } from "./ToggleButton";

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
          <BulkButton label="全てON" />
        </form>
        <form action={bulkToggle} className="flex-1">
          <input type="hidden" name="enabled" value="false" />
          <BulkButton label="全てOFF" danger />
        </form>
      </div>

      <div className="flex flex-col gap-0 border rounded-lg overflow-hidden">
        {scopes.map((scope) => {
          const enabled = statuses[scope] !== false;
          return (
            <div key={scope} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 bg-white">
              <span className="text-sm font-medium">{getScopeLabel(scope)}</span>
              <form action={toggleAccount}>
                <input type="hidden" name="scope" value={scope} />
                <input type="hidden" name="enabled" value={enabled ? "false" : "true"} />
                <ToggleButton enabled={enabled} />
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
