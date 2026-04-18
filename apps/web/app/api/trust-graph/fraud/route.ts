import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { TrustGraphEngine } from "@/lib/trust-graph/graph-engine";

const engine = new TrustGraphEngine();

export async function GET() {
  try {
    const flags = engine.runFraudDetection();
    return NextResponse.json({ flags });
  } catch (error) {
    return NextResponse.json({ error: "Failed to run fraud detection" }, { status: 500 });
  }
}

const FraudFlagInputSchema = z.object({
  nodeId: z.string(),
  flagType: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  evidence: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = FraudFlagInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    return NextResponse.json({ flag: parsed.data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create fraud flag" }, { status: 500 });
  }
}
