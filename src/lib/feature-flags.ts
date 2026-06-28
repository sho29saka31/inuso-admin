import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/firebase-admin";

export interface ViewerFeatures {
  service: boolean;
  event: boolean;
  booth: boolean;
  busy: boolean;
  eat: boolean;
  notice: boolean;
  digital: boolean;
  map: boolean;
}

export interface AdminFeatures {
  service: boolean;
  notice: boolean;
  booth: boolean;
  event: boolean;
  eat: boolean;
}

const VIEWER_DEFAULTS: ViewerFeatures = {
  service: true,
  event: true, booth: true, busy: true, eat: true,
  notice: true, digital: true, map: true,
};

const ADMIN_DEFAULTS: AdminFeatures = {
  service: true,
  notice: true, booth: true, event: true, eat: true,
};

export const getViewerFeatures = unstable_cache(
  async (): Promise<ViewerFeatures> => {
    try {
      const doc = await getDb().collection("config").doc("viewer_features").get();
      if (!doc.exists) return VIEWER_DEFAULTS;
      return { ...VIEWER_DEFAULTS, ...(doc.data() as Partial<ViewerFeatures>) };
    } catch {
      return VIEWER_DEFAULTS;
    }
  },
  ["viewer-features"],
  { tags: ["viewer-features"] }
);

export const getAdminFeatures = unstable_cache(
  async (): Promise<AdminFeatures> => {
    try {
      const doc = await getDb().collection("config").doc("admin_features").get();
      if (!doc.exists) return ADMIN_DEFAULTS;
      return { ...ADMIN_DEFAULTS, ...(doc.data() as Partial<AdminFeatures>) };
    } catch {
      return ADMIN_DEFAULTS;
    }
  },
  ["admin-features"],
  { tags: ["admin-features"] }
);

export async function getAdminAccounts(): Promise<Record<string, boolean>> {
  try {
    const doc = await getDb().collection("config").doc("admin_accounts").get();
    if (!doc.exists) return {};
    return (doc.data() as Record<string, boolean>) ?? {};
  } catch {
    return {};
  }
}

export async function isAccountEnabled(scope: string): Promise<boolean> {
  const accounts = await getAdminAccounts();
  if (!(scope in accounts)) return true;
  return accounts[scope] === true;
}
