export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/firebase-admin";
import { BoothForm } from "../BoothForm";
import { updateBooth } from "../actions";

export default async function BoothEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let booth: Record<string, unknown> | null = null;
  try {
    const db = getDb();
    const snap = await db.collection("booths").doc(id).get();
    if (!snap.exists) notFound();
    booth = snap.data() as Record<string, unknown>;
  } catch {
    return (
      <p className="text-danger text-sm">Firebase未設定。環境変数を確認してください。</p>
    );
  }

  async function update(formData: FormData) {
    "use server";
    await updateBooth(id, formData);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">ブース編集: {id}</h1>
      <BoothForm
        action={update}
        isEdit
        defaultValues={{
          boothId: booth.boothId as string,
          category: booth.category as string,
          name: booth.name as string,
          shopName: booth.shopName as string,
          location: booth.location as string,
          description: booth.description as string,
          boothImage: booth.boothImage as string,
          imageUrl: booth.imageUrl as string,
          status: booth.status as number,
          type: booth.type as string,
        }}
      />
    </div>
  );
}
