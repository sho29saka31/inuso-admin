import { getAdminScope } from "@/lib/admin-auth";
import AdminNoticeClient from "./AdminNoticeClient";
import { getAdminFeatures } from "@/lib/feature-flags";
import FeatureDisabled from "@/components/FeatureDisabled";

export default async function AdminNoticePage() {
  if (!(await getAdminFeatures()).notice) return <FeatureDisabled />;
  const scope = await getAdminScope();
  return <AdminNoticeClient scope={scope ?? ""} />;
}
