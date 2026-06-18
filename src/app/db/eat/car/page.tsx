import { getDb } from "@/lib/firebase-admin";
import { EatList } from "../EatList";

async function getCarItems() {
  try {
    const db = getDb();
    const snap = await db.collection("booths").where("boothId", ">=", "eat-car").where("boothId", "<", "eat-d").get();
    return snap.docs.map((d) => d.data() as { boothId: string; name: string; location: string; status: number });
  } catch {
    return null;
  }
}

export default async function EatCarPage() {
  const items = await getCarItems();

  if (items === null) {
    return <p className="text-danger text-sm">Firebase未設定。環境変数を確認してください。</p>;
  }

  return <EatList items={items} type="car" title="キッチンカー一覧" />;
}
