import { NextRequest, NextResponse } from "next/server";
import { setOperatorId, setAdminScope } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const { operatorId, scope } = await req.json();
  if (!operatorId || !operatorId.trim()) {
    return NextResponse.json({ error: "operatorId required" }, { status: 400 });
  }
  await setOperatorId(operatorId.trim());
  if (scope && scope.trim()) {
    await setAdminScope(scope.trim());
  }
  return NextResponse.json({ ok: true });
}
