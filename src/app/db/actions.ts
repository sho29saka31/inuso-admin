"use server";

import { redirect } from "next/navigation";
import { checkCredential, createSession, deleteSession } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const id = (formData.get("id") as string) ?? "";
  const pw = (formData.get("pw") as string) ?? "";
  const pin = (formData.get("pin") as string) ?? "";

  if (!await checkCredential("id", id)) {
    return { error: "IDが正しくありません", stage: 1 };
  }
  if (!await checkCredential("pw", pw)) {
    return { error: "パスワードが正しくありません", stage: 2 };
  }
  if (!await checkCredential("pin", pin)) {
    return { error: "PINが正しくありません", stage: 3 };
  }

  try {
    await createSession();
  } catch {
    return { error: "セッション作成に失敗しました。管理者に連絡してください。", stage: 3 };
  }
  redirect("/db/booth");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/db");
}
