export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/firebase-admin";
import { EventEditClient } from "./EventEditClient";

async function getEvent(eventId: string) {
  try {
    const db = getDb();
    const doc = await db.collection("events").doc(eventId).get();
    return doc.exists ? (doc.data() as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export default async function AdminEventEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  return <EventEditClient event={event} />;
}
