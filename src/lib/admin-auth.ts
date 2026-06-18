"use server";

import { cookies } from "next/headers";

const COOKIE = "admin_operator";
const EXPIRES = 60 * 60 * 8; // 8 hours

export async function getOperatorId(): Promise<string | null> {
  const cookieStore = await cookies();
  const val = cookieStore.get(COOKIE)?.value;
  return val && val.trim() ? val : null;
}

export async function setOperatorId(operatorId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, operatorId.trim(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: EXPIRES,
  });
}

export async function clearOperatorId() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
}
