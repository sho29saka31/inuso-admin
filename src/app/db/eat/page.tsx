import { getDb } from "@/lib/firebase-admin";
import { EatList } from "./EatList";

export const dynamic = "force-dynamic";

async function getEatItems() {
  try {
    const db = getDb();
    const snap = await db.collection("booths").where("category", "==", "eat").get();
    return snap.docs.map((d) => d.data() as { boothId: string; shopName?: string; type?: string; status: number });
  } catch {
    return null;
  }
}

export default async function EatPage() {
  const items = await getEatItems();

  if (items === null) {
    return <p className="text-danger text-sm">Firebase未設定。環境変数を確認してください。</p>;
  }

  return <EatList items={items} />;
}
