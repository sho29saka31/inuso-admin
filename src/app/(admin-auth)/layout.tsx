import { redirect } from "next/navigation";
import { getOperatorId } from "@/lib/admin-auth";
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
  return <AdminShell operatorId={operatorId}>{children}</AdminShell>;
}
