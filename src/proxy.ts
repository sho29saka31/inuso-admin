import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const rawSecret = process.env.SESSION_SECRET;
if (!rawSecret) throw new Error("SESSION_SECRET is not set");
const SECRET = new TextEncoder().encode(rawSecret);

const PROTECTED = /^\/db\/(booth|event|eat|notice|digital|config)/;

export async function proxy(request: NextRequest) {
  if (!PROTECTED.test(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("db_session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/db", request.url));
  }

  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/db", request.url));
  }
}

export const config = {
  matcher: ["/db/:path*"],
};
