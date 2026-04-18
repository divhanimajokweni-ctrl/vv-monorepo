/**
 * Ubuntu Pools — Villages API
 * REST endpoints for Village OS management
 */

import { NextRequest, NextResponse } from "next/server";
import { villageService } from "@ubuntu/villages";
import { z } from "zod";

const CreateVillageSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  currency: z.string().length(3).default("USD"),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
  location: z
    .object({
      country: z.string().optional(),
      region: z.string().optional(),
      coordinates: z
        .object({
          lat: z.number(),
          lng: z.number(),
        })
        .optional(),
    })
    .optional(),
  settings: z
    .object({
      minContribution: z.number().positive().optional(),
      maxMembers: z.number().positive().optional(),
      votingPeriodDays: z.number().positive().optional(),
      quorumThreshold: z.number().min(1).max(100).optional(),
      approvalThreshold: z.number().min(1).max(100).optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = CreateVillageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: result.error.issues },
        { status: 400 }
      );
    }

    const founderId = request.headers.get("x-user-id") || "system";
    const village = await villageService.createVillage({
      ...result.data,
      founderId,
    });

    return NextResponse.json(village, { status: 201 });
  } catch (error) {
    console.error("[POST /api/villages] Error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to create village" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const villages = await villageService.listVillages({
      search,
      limit: Math.min(limit, 100),
      offset,
    });

    return NextResponse.json(villages);
  } catch (error) {
    console.error("[GET /api/villages] Error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to list villages" },
      { status: 500 }
    );
  }
}
