export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/firebase-admin";
import { NoticeForm } from "../NoticeForm";
import { updateNotice } from "../actions";

export default async function NoticeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let item: Record<string, unknown> | null = null;
  try {
    const db = getDb();
    const snap = await db.collection("notices").doc(id).get();
    if (!snap.exists) notFound();
    item = snap.data() as Record<string, unknown>;
  } catch {
    return <p className="text-danger text-sm">Firebase未設定。</p>;
  }

  async function update(fd: FormData) {
    "use server";
    await updateNotice(id, fd);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">通知編集</h1>
      <NoticeForm action={update} isEdit defaultValues={{
        authorId: item.authorId as string,
        title: item.title as string,
        body: item.body as string,
        target: item.target as string,
        isUrgent: item.isUrgent as boolean,
      }} />
    </div>
  );
}
