import { getDb } from "@/lib/firebase-admin";
import { EatList } from "../EatList";

async function getPtaItems() {
  try {
    const db = getDb();
    const snap = await db.collection("booths").where("boothId", ">=", "eat-pta").where("boothId", "<", "eat-q").get();
    return snap.docs.map((d) => d.data() as { boothId: string; name: string; location: string; status: number });
  } catch {
    return null;
  }
}

export default async function EatPtaPage() {
  const items = await getPtaItems();
  if (items === null) return <p className="text-danger text-sm">Firebase未設定。</p>;
  return <EatList items={items} type="pta" title="PTAバザー一覧" />;
}
