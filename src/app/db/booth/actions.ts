"use server";

import { redirect } from "next/navigation";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { saveChangeLog } from "@/lib/changelog";

export interface BoothData {
  boothId: string;
  category: string;
  name: string;
  location: string;
  description: string;
  boothImage: string;
  status: number;
  waitCount: number;
  mode: string;
}

export async function createBooth(formData: FormData) {
  const db = getDb();
  const now = nowTimestamp();
  const data: BoothData = {
    boothId: (formData.get("boothId") as string).trim(),
    category: formData.get("category") as string,
    name: formData.get("name") as string,
    location: formData.get("location") as string,
    description: formData.get("description") as string,
    boothImage: formData.get("boothImage") as string,
    status: Number(formData.get("status") ?? 1),
    waitCount: 0,
    mode: "manual",
  };

  await db.collection("booths").doc(data.boothId).set({
    ...data,
    bluetoothData: null,
    threshold: null,
    updatedAt: now,
  });

  await saveChangeLog({
    operatorId: "db-admin",
    targetCollection: "booths",
    targetId: data.boothId,
    changeType: "create",
    changedFields: { created: data },
  });

  redirect("/db/booth");
}

export async function updateBooth(boothId: string, formData: FormData) {
  const db = getDb();
  const now = nowTimestamp();
  const fields = {
    name: formData.get("name") as string,
    location: formData.get("location") as string,
    description: formData.get("description") as string,
    boothImage: formData.get("boothImage") as string,
    status: Number(formData.get("status") ?? 1),
    category: formData.get("category") as string,
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

  redirect("/db/booth");
}

export async function deleteBooth(boothId: string) {
  const db = getDb();
  await db.collection("booths").doc(boothId).delete();
  await saveChangeLog({
    operatorId: "db-admin",
    targetCollection: "booths",
    targetId: boothId,
    changeType: "delete",
    changedFields: {},
  });
  redirect("/db/booth");
}
