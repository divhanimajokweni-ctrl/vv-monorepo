/**
 * Ubuntu Pools — Individual Village API
 * GET, PUT, DELETE for specific village
 */

import { NextRequest, NextResponse } from "next/server";
import { villageService } from "@ubuntu/villages";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const village = await villageService.getVillage(id);

    if (!village) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Village not found" },
        { status: 404 }
      );
    }

    const members = await villageService.getVillageMembers(id);
    const pools = await villageService.getVillagePools(id);
    const score = await villageService.calculateVillageScore(id);

    return NextResponse.json({
      ...village,
      members,
      pools,
      calculatedScore: score,
    });
  } catch (error) {
    console.error("[GET /api/villages/[id]] Error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to get village" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const village = await villageService.getVillage(id);
    if (!village) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Village not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Update not implemented yet" });
  } catch (error) {
    console.error("[PUT /api/villages/[id]] Error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to update village" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const village = await villageService.getVillage(id);
    if (!village) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Village not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Delete not implemented yet" });
  } catch (error) {
    console.error("[DELETE /api/villages/[id]] Error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to delete village" },
      { status: 500 }
    );
  }
}
