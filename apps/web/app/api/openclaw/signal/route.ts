import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import { serviceBus } from "@/lib/services/service-bus";

const TIMESTAMP_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

const signalSchema = z.object({
  type: z.enum(["LINDIWE_SIGNAL", "HEALTH_CHECK", "OVERRIDE", "ALERT"]),
  data: z.record(z.string(), z.unknown()),
});

function getSigningSecret(): string {
  return (
    process.env.OPENCLAW_SIGNING_SECRET ||
    process.env.OPENCLAW_API_KEY ||
    ""
  );
}

function verifyHmac(
  body: string,
  timestamp: string,
  signature: string
): boolean {
  const secret = getSigningSecret();
  if (!secret) return false;

  const payload = `${timestamp}.${body}`;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}

function isTimestampFresh(timestamp: string): boolean {
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return false;
  const age = Math.abs(Date.now() - ts);
  return age <= TIMESTAMP_MAX_AGE_MS;
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-sig") || request.headers.get("x-signature");
  const timestamp = request.headers.get("x-ts") || request.headers.get("x-timestamp");

  if (!signature || !timestamp) {
    return NextResponse.json(
      { error: "Missing x-sig and x-ts headers" },
      { status: 401 }
    );
  }

  if (!isTimestampFresh(timestamp)) {
    return NextResponse.json(
      { error: "Request timestamp expired" },
      { status: 401 }
    );
  }

  const body = await request.text();

  if (!verifyHmac(body, timestamp, signature)) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 403 }
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = signalSchema.safeParse(parsed);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { type, data } = result.data;

  await serviceBus.emit(`openclaw:${type.toLowerCase()}`, {
    type,
    data,
    receivedAt: new Date().toISOString(),
  });

  console.log(`[OpenClaw Signal] Received ${type} signal`);

  return NextResponse.json({ ok: true, type });
}
