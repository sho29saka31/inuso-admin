import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { safeCompare } from "@/lib/safe-compare";

// Vercel の Deployment Webhook を受信し、Discordへ通知する。
// Vercelダッシュボード（Account/Team Settings > Webhooks）でこのプロジェクトのデプロイイベントを
// このエンドポイントに登録し、発行されたSigning SecretをVERCEL_WEBHOOK_SECRETに設定すること。
const NOTIFY_TYPES = new Set([
  "deployment.succeeded",
  "deployment.error",
  "deployment.created",
]);

const COLOR_BY_TYPE: Record<string, number> = {
  "deployment.succeeded": 0x2ecc71,
  "deployment.error": 0xe74c3c,
  "deployment.created": 0x3498db,
};

export async function POST(req: NextRequest) {
  const secret = process.env.VERCEL_WEBHOOK_SECRET;
  const signature = req.headers.get("x-vercel-signature");
  const rawBody = await req.text();

  if (!secret || !signature) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const expected = createHmac("sha1", secret).update(rawBody).digest("hex");
  if (!safeCompare(signature, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { type?: string; payload?: Record<string, unknown> };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const type = body.type;
  if (!type || !NOTIFY_TYPES.has(type)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!discordWebhookUrl) {
    return NextResponse.json({ error: "DISCORD_WEBHOOK_URL not configured" }, { status: 500 });
  }

  const payload = body.payload as Record<string, unknown> | undefined;
  const deployment = payload?.deployment as Record<string, unknown> | undefined;
  const name = (deployment?.name as string) ?? (payload?.name as string) ?? "unknown project";
  const deploymentUrl = deployment?.url ? `https://${deployment.url}` : undefined;

  await fetch(discordWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [
        {
          title: `${type} — ${name}`,
          url: deploymentUrl,
          color: COLOR_BY_TYPE[type],
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
