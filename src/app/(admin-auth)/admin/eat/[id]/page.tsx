export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/firebase-admin";
import { EatStatusEditClient } from "./EatStatusEditClient";

async function getBooth(boothId: string) {
  try {
    const db = getDb();
    const doc = await db.collection("booths").doc(boothId).get();
    if (!doc.exists) return null;
    const data = doc.data() as Record<string, unknown>;
    return data.category === "eat" ? data : null;
  } catch {
    return null;
  }
}

export default async function AdminEatEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booth = await getBooth(id);
  if (!booth) notFound();

  return <EatStatusEditClient booth={booth} />;
}
