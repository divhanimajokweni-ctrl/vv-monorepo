import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { payouts, members, villages } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const CreatePayoutSchema = z.object({
  villageId: z.string().uuid(),
  recipientMemberId: z.string().uuid(),
  amount: z.number().min(1), // in cents
  cycleNumber: z.number().min(1),
});

// GET /api/payouts - List payouts for user's villages
export async function GET() {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get payouts for villages where user is a member
    const userVillageIds = await db
      .select({ villageId: members.villageId })
      .from(members)
      .where(eq(members.userId, user.id));

    const villageIds = userVillageIds.map(uv => uv.villageId);

    if (villageIds.length === 0) {
      return NextResponse.json([]);
    }

    const userPayouts = await db
      .select({
        id: payouts.id,
        villageId: payouts.villageId,
        recipientMemberId: payouts.recipientMemberId,
        amount: payouts.amount,
        cycleNumber: payouts.cycleNumber,
        status: payouts.status,
        paidAt: payouts.paidAt,
        villageName: villages.name,
      })
      .from(payouts)
      .innerJoin(villages, eq(payouts.villageId, villages.id))
      .where(and(
        eq(payouts.villageId, villageIds[0]), // For now, just check first village
        // TODO: Handle multiple villages
      ));

    return NextResponse.json(userPayouts);
  } catch (error) {
    console.error('Failed to fetch payouts:', error);
    return NextResponse.json({ error: "Failed to fetch payouts" }, { status: 500 });
  }
}

// POST /api/payouts - Process a payout (admin only)
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = CreatePayoutSchema.parse(body);

    // Verify user is admin of the village
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.userId, user.id),
        eq(members.villageId, validatedData.villageId),
        eq(members.role, 'admin')
      ));

    if (!membership) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Verify recipient is a member of the village
    const [recipient] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.id, validatedData.recipientMemberId),
        eq(members.villageId, validatedData.villageId)
      ));

    if (!recipient) {
      return NextResponse.json({ error: "Recipient not found in village" }, { status: 404 });
    }

    // Create payout record
    const [payout] = await db
      .insert(payouts)
      .values({
        villageId: validatedData.villageId,
        recipientMemberId: validatedData.recipientMemberId,
        amount: validatedData.amount,
        cycleNumber: validatedData.cycleNumber,
        status: 'pending', // Will be processed asynchronously
      })
      .returning();

    // TODO: Trigger actual payout processing

    return NextResponse.json(payout, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.flatten() }, { status: 400 });
    }
    console.error('Failed to create payout:', error);
    return NextResponse.json({ error: "Failed to create payout" }, { status: 500 });
  }
}