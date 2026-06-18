"use server";

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

export async function updateEatItem(boothId: string, formData: FormData) {
  const db = getDb();
  const now = nowTimestamp();
  const fields = {
    instagramUrl: formData.get("instagramUrl") as string,
    products: parseProducts(formData),
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

  const { redirect } = await import("next/navigation");
  redirect("/db/eat");
}
