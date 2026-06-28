import { redirect } from "next/navigation";
import { getOperatorId, getAdminScope } from "@/lib/admin-auth";
import { getAdminFeatures } from "@/lib/feature-flags";
import { AdminShell } from "./AdminShell";

export default async function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const operatorId = await getOperatorId();
  if (!operatorId) {
    redirect("/admin/login");
  }

  const adminFeatures = await getAdminFeatures();
  if (adminFeatures.service === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-4 px-6 text-center">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-gray-400">
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
        <h1 className="text-lg font-bold">運営サービスは現在停止中です</h1>
        <p className="text-sm text-text-sub">DB管理者画面からサービスを再開してください。</p>
      </div>
    );
  }

  const scope = await getAdminScope();
  return (
    <AdminShell operatorId={operatorId} scope={scope ?? ""}>
      {children}
    </AdminShell>
  );
}
