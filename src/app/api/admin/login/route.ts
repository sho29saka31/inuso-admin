import { NextRequest, NextResponse } from "next/server";
import { setOperatorId, setAdminScope } from "@/lib/admin-auth";
import { safeCompare } from "@/lib/safe-compare";

function getPasswords(): Record<string, string> {
  const raw = process.env.ADMIN_PASSWORDS;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Record<string, unknown>;
  const scope = typeof body.scope === "string" ? body.scope.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!scope) {
    return NextResponse.json({ error: "scope required" }, { status: 400 });
  }

  const passwords = getPasswords();
  if (Object.keys(passwords).length === 0) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const expected = passwords[scope];
  if (!expected || !safeCompare(expected, password)) {
    return NextResponse.json({ error: "パスワードが違います" }, { status: 401 });
  }

  await setOperatorId(scope);
  await setAdminScope(scope);
  return NextResponse.json({ ok: true });
}
