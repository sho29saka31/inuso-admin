import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { secret, paths } = await req.json();
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const viewerUrl = process.env.VIEWER_REVALIDATE_URL;
  const viewerSecret = process.env.VIEWER_REVALIDATE_SECRET;
  if (!viewerUrl || !viewerSecret) {
    return NextResponse.json({ error: "VIEWER_REVALIDATE_URL not configured" }, { status: 500 });
  }

  const res = await fetch(viewerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: viewerSecret, paths }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Viewer revalidate failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
