import { redirect } from "next/navigation";
import { getOperatorId, getAdminScope } from "@/lib/admin-auth";
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
  const scope = await getAdminScope();
  return (
    <AdminShell operatorId={operatorId} scope={scope ?? ""}>
      {children}
    </AdminShell>
  );
}
