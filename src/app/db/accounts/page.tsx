export const dynamic = "force-dynamic";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { saveChangeLog } from "@/lib/changelog";
import { verifySession } from "@/lib/auth";

async function getAccountStatuses(): Promise<Record<string, boolean>> {
  try {
    const snap = await getDb().collection("config").doc("admin_accounts").get();
    return snap.exists ? (snap.data() as Record<string, boolean>) : {};
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
  const now = nowTimestamp();
  const fields = { [scope]: enabled, updatedAt: now };
  await db.collection("config").doc("admin_accounts").set(fields, { merge: true });
  await saveChangeLog({
    operatorId: "db-admin",
    targetCollection: "config",
    targetId: "admin_accounts",
    changeType: "update",
    changedFields: { [scope]: enabled },
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

      <div className="flex flex-col gap-0 border rounded-lg overflow-hidden">
        {scopes.map((scope) => {
          const enabled = statuses[scope] !== false;
          return (
            <div key={scope} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 bg-white">
              <span className="text-sm font-medium">{scope}</span>
              <div className="flex gap-2">
                <form action={toggleAccount}>
                  <input type="hidden" name="scope" value={scope} />
                  <input type="hidden" name="enabled" value="true" />
                  <button
                    type="submit"
                    className={`px-3 py-1 text-xs rounded-full font-bold border transition-colors ${enabled ? "bg-primary text-white border-primary" : "bg-white text-text-sub border-gray-300"}`}
                  >
                    ON
                  </button>
                </form>
                <form action={toggleAccount}>
                  <input type="hidden" name="scope" value={scope} />
                  <input type="hidden" name="enabled" value="false" />
                  <button
                    type="submit"
                    className={`px-3 py-1 text-xs rounded-full font-bold border transition-colors ${!enabled ? "bg-danger text-white border-danger" : "bg-white text-text-sub border-gray-300"}`}
                  >
                    OFF
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
