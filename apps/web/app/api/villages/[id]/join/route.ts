/**
 * Ubuntu Pools — Join Village API
 */

import { NextRequest, NextResponse } from "next/server";
import { villageService } from "@/lib/services/village-service";
import { z } from "zod";

const JoinVillageSchema = z.object({
  role: z.enum(["admin", "treasurer", "member"]).default("member"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: villageId } = await params;
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "User ID required" },
        { status: 401 }
      );
    }

    const village = await villageService.getVillage(villageId);
    if (!village) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Village not found" },
        { status: 404 }
      );
    }

    const existingMember = await villageService.getMemberRole(villageId, userId);
    if (existingMember) {
      return NextResponse.json(
        { error: "ALREADY_MEMBER", message: "User is already a member" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = JoinVillageSchema.safeParse(body);

    const member = await villageService.joinVillage({
      villageId,
      userId,
      role: result.success ? result.data.role : "member",
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("[POST /api/villages/[id]/join] Error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to join village" },
      { status: 500 }
    );
  }
}
