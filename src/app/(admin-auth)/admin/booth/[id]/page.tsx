export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/firebase-admin";
import { BoothEditClient } from "./BoothEditClient";

async function getBooth(boothId: string) {
  try {
    const db = getDb();
    const doc = await db.collection("booths").doc(boothId).get();
    return doc.exists ? (doc.data() as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export default async function AdminBoothEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booth = await getBooth(id);
  if (!booth) notFound();

  return <BoothEditClient booth={booth} />;
}
