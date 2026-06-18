import { notFound } from "next/navigation";
import { getDb } from "@/lib/firebase-admin";
import { EatForm } from "../../EatForm";
import { updateEatItem } from "../../actions";

export default async function EatCarEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let item: Record<string, unknown> | null = null;
  try {
    const db = getDb();
    const snap = await db.collection("booths").doc(id).get();
    if (!snap.exists) notFound();
    item = snap.data() as Record<string, unknown>;
  } catch {
    return <p className="text-danger text-sm">Firebase未設定。</p>;
  }

  async function update(fd: FormData) {
    "use server";
    await updateEatItem(id, "car", fd);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">キッチンカー編集</h1>
      <EatForm action={update} type="car" isEdit defaultValues={{
        name: item.name as string,
        location: item.location as string,
        description: item.description as string,
        boothImage: item.boothImage as string,
        status: item.status as number,
      }} />
    </div>
  );
}
