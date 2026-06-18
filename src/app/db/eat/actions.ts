"use server";

import { redirect } from "next/navigation";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { saveChangeLog } from "@/lib/changelog";

export async function createEatItem(type: "car" | "pta", formData: FormData) {
  const db = getDb();
  const now = nowTimestamp();
  const id = type === "pta" ? "eat-pta" : `eat-car-${Date.now()}`;
  const data = {
    boothId: id,
    category: "eat",
    name: formData.get("name") as string,
    location: formData.get("location") as string,
    description: formData.get("description") as string,
    boothImage: formData.get("boothImage") as string,
    status: Number(formData.get("status") ?? 1),
    waitCount: 0,
    mode: "manual",
    bluetoothData: null,
    threshold: null,
    updatedAt: now,
  };

  await db.collection("booths").doc(id).set(data);
  await saveChangeLog({
    operatorId: "db-admin",
    targetCollection: "booths",
    targetId: id,
    changeType: "create",
    changedFields: { created: data },
  });

  redirect(`/db/eat/${type}`);
}

export async function updateEatItem(boothId: string, type: "car" | "pta", formData: FormData) {
  const db = getDb();
  const now = nowTimestamp();
  const fields = {
    name: formData.get("name") as string,
    location: formData.get("location") as string,
    description: formData.get("description") as string,
    boothImage: formData.get("boothImage") as string,
    status: Number(formData.get("status") ?? 1),
    updatedAt: now,
  };

  await db.collection("booths").doc(boothId).update(fields);
  await saveChangeLog({
    operatorId: "db-admin",
    targetCollection: "booths",
    targetId: boothId,
    changeType: "update",
    changedFields: fields,
  });

  redirect(`/db/eat/${type}`);
}

export async function deleteEatItem(boothId: string, type: "car" | "pta") {
  const db = getDb();
  await db.collection("booths").doc(boothId).delete();
  await saveChangeLog({
    operatorId: "db-admin",
    targetCollection: "booths",
    targetId: boothId,
    changeType: "delete",
    changedFields: {},
  });
  redirect(`/db/eat/${type}`);
}
