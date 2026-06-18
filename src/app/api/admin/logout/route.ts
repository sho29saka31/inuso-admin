import { NextResponse } from "next/server";
import { clearOperatorId } from "@/lib/admin-auth";

export async function POST() {
  await clearOperatorId();
  return NextResponse.json({ ok: true });
}
