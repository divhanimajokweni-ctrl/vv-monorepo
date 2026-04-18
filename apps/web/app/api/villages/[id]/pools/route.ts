/**
 * Ubuntu Pools — Village Pools API
 */

import { NextRequest, NextResponse } from "next/server";
import { villageService } from "@ubuntu/villages";
import { z } from "zod";

const CreatePoolSchema = z.object({
  poolType: z.enum(["savings", "procurement", "investment", "insurance"]),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  contributionAmount: z.number().positive(),
  totalCycles: z.number().positive().max(52),
  cycleDuration: z.number().positive().max(365).default(30),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: villageId } = await params;
    const pools = await villageService.getVillagePools(villageId);
    return NextResponse.json(pools);
  } catch (error) {
    console.error("[GET /api/villages/[id]/pools] Error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to get pools" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: villageId } = await params;
    const body = await request.json();
    const result = CreatePoolSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: result.error.issues },
        { status: 400 }
      );
    }

    const pool = await villageService.createPool({
      villageId,
      ...result.data,
    });

    return NextResponse.json(pool, { status: 201 });
  } catch (error) {
    console.error("[POST /api/villages/[id]/pools] Error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to create pool" },
      { status: 500 }
    );
  }
}
