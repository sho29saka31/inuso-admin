"use server";

import { redirect } from "next/navigation";
import { checkCredential, createSession, deleteSession } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const id = (formData.get("id") as string) ?? "";
  const pw = (formData.get("pw") as string) ?? "";
  const pin = (formData.get("pin") as string) ?? "";

  if (!checkCredential("id", id)) {
    return { error: "IDが正しくありません", stage: 1 };
  }
  if (!checkCredential("pw", pw)) {
    return { error: "パスワードが正しくありません", stage: 2 };
  }
  if (!checkCredential("pin", pin)) {
    return { error: "PINが正しくありません", stage: 3 };
  }

  await createSession();
  redirect("/db/booth");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/db");
}
