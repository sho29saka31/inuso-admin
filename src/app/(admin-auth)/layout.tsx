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
    redirect("/db/features");
  }

  const scope = await getAdminScope();
  return (
    <AdminShell operatorId={operatorId} scope={scope ?? ""}>
      {children}
    </AdminShell>
  );
}
