import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { VerificationLevelSchema } from "@/lib/sybil/types";
import { canAdvanceToLevel } from "@/lib/sybil/human-verification";

const bodySchema = z.object({
  userId: z.string().min(1),
  currentLevel: VerificationLevelSchema,
  targetLevel: VerificationLevelSchema,
  accountAgeDays: z.number().min(0),
  hasDeviceKey: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, currentLevel, targetLevel, accountAgeDays, hasDeviceKey } = parsed.data;

    const result = canAdvanceToLevel(currentLevel, targetLevel, {
      accountAgeDays,
      hasDeviceKey,
    });

    if (!result.allowed) {
      return NextResponse.json(
        { userId, advanced: false, reason: result.reason },
        { status: 403 }
      );
    }

    // In production: update sybil_profiles + insert sybil_verification_events
    return NextResponse.json({
      userId,
      advanced: true,
      fromLevel: currentLevel,
      toLevel: targetLevel,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
