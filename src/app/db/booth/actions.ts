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
  const category = formData.get("category") as string;
  const boothId = (formData.get("boothId") as string).trim();
  const isEat = category === "eat";

  const base = {
    boothId,
    category,
    status: Number(formData.get("status") ?? 1),
    waitCount: 0,
    mode: "manual",
    bluetoothData: null,
    threshold: null,
    updatedAt: now,
  };

  const shopName = isEat ? (formData.get("shopName") as string) : "";
  const extra = isEat
    ? {
        type: formData.get("type") as string,
        name: shopName,
        shopName,
        location: formData.get("location") as string,
        imageUrl: formData.get("imageUrl") as string,
        products: [],
        instagramUrl: "",
      }
    : {
        name: formData.get("name") as string,
        location: formData.get("location") as string,
        description: formData.get("description") as string,
        boothImage: formData.get("boothImage") as string,
      };

  const data = { ...base, ...extra };

  await db.collection("booths").doc(boothId).set(data);

  await saveChangeLog({
    operatorId: "db-admin",
    targetCollection: "booths",
    targetId: boothId,
    changeType: "create",
    changedFields: { created: data as unknown as Record<string, unknown> },
  });

  redirect("/db/booth");
}

export async function updateBooth(boothId: string, formData: FormData) {
  const db = getDb();
  const now = nowTimestamp();
  const category = formData.get("category") as string;
  const isEat = category === "eat";
  const shopName = isEat ? (formData.get("shopName") as string) : "";
  const fields = isEat
    ? {
        name: shopName,
        shopName,
        location: formData.get("location") as string,
        imageUrl: formData.get("imageUrl") as string,
        status: Number(formData.get("status") ?? 1),
        updatedAt: now,
      }
    : {
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
