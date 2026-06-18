import { notFound } from "next/navigation";
import { getDb } from "@/lib/firebase-admin";
import { EventForm } from "../EventForm";
import { updateEvent } from "../actions";

export default async function EventEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let ev: Record<string, unknown> | null = null;
  try {
    const db = getDb();
    const snap = await db.collection("events").doc(id).get();
    if (!snap.exists) notFound();
    ev = snap.data() as Record<string, unknown>;
  } catch {
    return <p className="text-danger text-sm">Firebase未設定。環境変数を確認してください。</p>;
  }

  async function update(formData: FormData) {
    "use server";
    await updateEvent(id, formData);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">イベント編集</h1>
      <EventForm
        action={update}
        isEdit
        defaultValues={{
          eventName: ev.eventName as string,
          day: ev.day as string,
          startTime: ev.startTime as string,
          endTime: ev.endTime as string,
          location: ev.location as string,
          details: ev.details as string,
          isDelayed: ev.isDelayed as boolean,
          delayMinutes: ev.delayMinutes as number,
        }}
      />
    </div>
  );
}
