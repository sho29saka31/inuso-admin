"use server";

import { redirect } from "next/navigation";
import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { saveChangeLog } from "@/lib/changelog";

function parseProducts(formData: FormData) {
  const products: { name: string; price: number }[] = [];
  let i = 0;
  while (formData.has(`product_name_${i}`)) {
    const name = (formData.get(`product_name_${i}`) as string).trim();
    const price = Number(formData.get(`product_price_${i}`) ?? 0);
    if (name) products.push({ name, price });
    i++;
  }
  return products;
}

export async function createEatItem(formData: FormData) {
  const db = getDb();
  const now = nowTimestamp();
  const type = formData.get("type") as "car" | "pta";
  const id = type === "pta" ? `eat-pta-${Date.now()}` : `eat-car-${Date.now()}`;
  const data = {
    boothId: id,
    category: "eat",
    type,
    shopName: formData.get("shopName") as string,
    instagramUrl: formData.get("instagramUrl") as string,
    products: parseProducts(formData),
    imageUrl: formData.get("imageUrl") as string,
    status: Number(formData.get("status") ?? 1),
    updatedAt: now,
  };

  await db.collection("booths").doc(id).set(data);
  await saveChangeLog({
    operatorId: "db-admin",
    targetCollection: "booths",
    targetId: id,
    changeType: "create",
    changedFields: { created: data as unknown as Record<string, unknown> },
  });

  redirect("/db/eat");
}

export async function updateEatItem(boothId: string, formData: FormData) {
  const db = getDb();
  const now = nowTimestamp();
  const fields = {
    shopName: formData.get("shopName") as string,
    instagramUrl: formData.get("instagramUrl") as string,
    products: parseProducts(formData),
    imageUrl: formData.get("imageUrl") as string,
    status: Number(formData.get("status") ?? 1),
    updatedAt: now,
  };

  await db.collection("booths").doc(boothId).update(fields);
  await saveChangeLog({
    operatorId: "db-admin",
    targetCollection: "booths",
    targetId: boothId,
    changeType: "update",
    changedFields: fields as unknown as Record<string, unknown>,
  });

  redirect("/db/eat");
}

export async function deleteEatItem(boothId: string) {
  const db = getDb();
  await db.collection("booths").doc(boothId).delete();
  await saveChangeLog({
    operatorId: "db-admin",
    targetCollection: "booths",
    targetId: boothId,
    changeType: "delete",
    changedFields: {},
  });
  redirect("/db/eat");
}
