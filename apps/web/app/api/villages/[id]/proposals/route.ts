/**
 * Ubuntu Pools — Village Proposals API
 */

import { NextRequest, NextResponse } from "next/server";
import { villageService } from "@ubuntu/villages";
import { z } from "zod";

const CreateProposalSchema = z.object({
  proposalType: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: villageId } = await params;
    const proposals = await villageService.getVillageProposals(villageId);
    return NextResponse.json(proposals);
  } catch (error) {
    console.error("[GET /api/villages/[id]/proposals] Error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to get proposals" },
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
    const proposerId = request.headers.get("x-user-id");

    if (!proposerId) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "User ID required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = CreateProposalSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: result.error.issues },
        { status: 400 }
      );
    }

    const proposal = await villageService.createProposal({
      villageId,
      proposerId,
      ...result.data,
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    console.error("[POST /api/villages/[id]/proposals] Error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to create proposal" },
      { status: 500 }
    );
  }
}
