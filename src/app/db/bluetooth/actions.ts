"use server";

import { revalidatePath } from "next/cache";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth";

async function requireSession() {
  if (!await verifySession()) throw new Error("Unauthorized");
}

export async function setBoothManual(boothId: string, isManual: boolean) {
  await requireSession();
  const db = getDb();
  await db.collection("booths").doc(boothId).update({ isManual, updatedAt: nowTimestamp() });
  revalidatePath("/db/bluetooth");
}

export async function setBulkManual(isManual: boolean) {
  await requireSession();
  const db = getDb();
  const snap = await db.collection("booths").get();
  const batch = db.batch();
  const now = nowTimestamp();
  snap.docs.forEach((doc) => batch.update(doc.ref, { isManual, updatedAt: now }));
  await batch.commit();
  revalidatePath("/db/bluetooth");
}
