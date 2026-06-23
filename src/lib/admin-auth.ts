"use server";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "admin_session";
const EXPIRES = 60 * 60 * 8;

function getSecret(): Uint8Array {
  const raw = process.env.SESSION_SECRET;
  if (!raw) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(raw);
}

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: EXPIRES,
};

async function getPayload(): Promise<{ operatorId: string; scope: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, getSecret());
    const operatorId = payload.operatorId;
    const scope = payload.scope;
    if (typeof operatorId !== "string" || !operatorId) return null;
    return { operatorId, scope: typeof scope === "string" ? scope : operatorId };
  } catch {
    return null;
  }
}

export async function getOperatorId(): Promise<string | null> {
  return (await getPayload())?.operatorId ?? null;
}

export async function getAdminScope(): Promise<string | null> {
  return (await getPayload())?.scope ?? null;
}

export async function setOperatorSession(operatorId: string, scope: string) {
  const token = await new SignJWT({ operatorId, scope })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${EXPIRES}s`)
    .sign(getSecret());
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, COOKIE_OPTS);
}

/** @deprecated Use setOperatorSession instead */
export async function setOperatorId(operatorId: string) {
  await setOperatorSession(operatorId, operatorId);
}

/** @deprecated Use setOperatorSession instead */
export async function setAdminScope(scope: string) {
  const current = await getPayload();
  if (current) await setOperatorSession(current.operatorId, scope);
}

export async function clearOperatorId() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
  cookieStore.delete("admin_operator");
  cookieStore.delete("admin_scope");
}
