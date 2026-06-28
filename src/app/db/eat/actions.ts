"use server";

import { getDb, nowTimestamp } from "@/lib/firebase-admin";
import { saveChangeLog } from "@/lib/changelog";
import { verifySession } from "@/lib/auth";

function parseProducts(formData: FormData) {
  const products: { name: string; price: number; imageUrl?: string }[] = [];
  let i = 0;
  while (formData.has(`product_name_${i}`)) {
    const name = (formData.get(`product_name_${i}`) as string).trim();
    const price = Number(formData.get(`product_price_${i}`) ?? 0);
    const imageUrl = (formData.get(`product_imageUrl_${i}`) as string | null)?.trim() || undefined;
    if (name) products.push({ name, price, ...(imageUrl ? { imageUrl } : {}) });
    i++;
  }
  return products;
}

export async function updateEatItem(boothId: string, formData: FormData) {
  if (!await verifySession()) throw new Error("Unauthorized");
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
