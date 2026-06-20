import { getAdminScope } from "@/lib/admin-auth";
import AdminNoticeClient from "./AdminNoticeClient";

export default async function AdminNoticePage() {
  const scope = await getAdminScope();
  return <AdminNoticeClient scope={scope ?? ""} />;
}
