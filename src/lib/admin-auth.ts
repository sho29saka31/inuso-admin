"use server";

import { cookies } from "next/headers";

const COOKIE_OPERATOR = "admin_operator";
const COOKIE_SCOPE = "admin_scope";
const EXPIRES = 60 * 60 * 8; // 8 hours

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: EXPIRES,
};

export async function getOperatorId(): Promise<string | null> {
  const cookieStore = await cookies();
  const val = cookieStore.get(COOKIE_OPERATOR)?.value;
  return val && val.trim() ? val : null;
}

export async function setOperatorId(operatorId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_OPERATOR, operatorId.trim(), COOKIE_OPTS);
}

export async function clearOperatorId() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_OPERATOR);
  cookieStore.delete(COOKIE_SCOPE);
}

export async function getAdminScope(): Promise<string | null> {
  const cookieStore = await cookies();
  const val = cookieStore.get(COOKIE_SCOPE)?.value;
  return val && val.trim() ? val : null;
}

export async function setAdminScope(scope: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_SCOPE, scope.trim(), COOKIE_OPTS);
}
