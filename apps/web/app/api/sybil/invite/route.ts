import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";

const createInviteSchema = z.object({
  sponsorId: z.string().min(1),
  villageId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createInviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { sponsorId, villageId } = parsed.data;
    const inviteCode = randomUUID();

    // In production: insert into sybil_invitations, look up sponsor depth
    const invitation = {
      id: randomUUID(),
      sponsorId,
      inviteeId: null,
      inviteCode,
      depth: 0,
      status: "pending",
      villageId: villageId ?? null,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sponsorId = searchParams.get("sponsorId");

    if (!sponsorId) {
      return NextResponse.json({ error: "sponsorId is required" }, { status: 400 });
    }

    // In production: query sybil_invitations by sponsorId
    const invitations: unknown[] = [];

    return NextResponse.json({ sponsorId, invitations });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
