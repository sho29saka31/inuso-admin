import { NextRequest, NextResponse } from "next/server";
import { setOperatorId } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const { operatorId } = await req.json();
  if (!operatorId || !operatorId.trim()) {
    return NextResponse.json({ error: "operatorId required" }, { status: 400 });
  }
  await setOperatorId(operatorId.trim());
  return NextResponse.json({ ok: true });
}
