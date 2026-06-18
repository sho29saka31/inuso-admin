"use server";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "fallback-secret-change-in-production"
);
const COOKIE = "db_session";
const EXPIRES = 60 * 60 * 8; // 8 hours

export async function createSession() {
  const token = await new SignJWT({ auth: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${EXPIRES}s`)
    .sign(SECRET);

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
    await jwtVerify(token, SECRET);
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
  if (stage === "id") return value === (process.env.DB_ADMIN_ID ?? "");
  if (stage === "pw") return value === (process.env.DB_ADMIN_PW ?? "");
  if (stage === "pin") return value === (process.env.DB_ADMIN_PIN ?? "");
  return false;
}
