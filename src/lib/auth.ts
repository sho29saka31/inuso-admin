"use server";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { safeCompare } from "./safe-compare";

function getSecret(): Uint8Array {
  const rawSecret = process.env.SESSION_SECRET;
  if (!rawSecret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(rawSecret);
}
const COOKIE = "db_session";
const EXPIRES = 60 * 60 * 8; // 8 hours

export async function createSession() {
  const token = await new SignJWT({ auth: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${EXPIRES}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: EXPIRES,
  });
}

export async function verifySession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE)?.value;
    if (!token) return false;
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
}

export async function checkCredential(stage: "id" | "pw" | "pin", value: string): Promise<boolean> {
  if (stage === "id") {
    const expected = process.env.DB_ADMIN_ID;
    return !!expected && safeCompare(value, expected);
  }
  if (stage === "pw") {
    const expected = process.env.DB_ADMIN_PW;
    return !!expected && safeCompare(value, expected);
  }
  if (stage === "pin") {
    const expected = process.env.DB_ADMIN_PIN;
    if (!expected) return true; // PIN未設定時はオプション扱い
    return safeCompare(value, expected);
  }
  return false;
}
