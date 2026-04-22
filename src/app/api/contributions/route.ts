import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { contributions, members } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { processPayment } from "@/lib/payments/dodo";

const CreateContributionSchema = z.object({
  memberId: z.string().uuid(),
  amount: z.number().min(1), // in cents
  cycleNumber: z.number().min(1),
});

// POST /api/contributions - Make a contribution
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = CreateContributionSchema.parse(body);

    // Verify the member belongs to the user
    const [member] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.id, validatedData.memberId),
        eq(members.userId, user.id)
      ));

    if (!member) {
      return NextResponse.json({ error: "Member not found or access denied" }, { status: 404 });
    }

    // Process payment
    const paymentResult = await processPayment({
      amount: validatedData.amount,
      currency: 'ZAR',
      description: `Contribution to village ${member.villageId}`,
      reference: `contrib_${Date.now()}`,
    });

    if (!paymentResult.success) {
      return NextResponse.json({ error: "Payment failed" }, { status: 400 });
    }

    // Record contribution
    const [contribution] = await db
      .insert(contributions)
      .values({
        memberId: validatedData.memberId,
        villageId: member.villageId,
        amount: validatedData.amount,
        cycleNumber: validatedData.cycleNumber,
        paymentReference: paymentResult.transactionId,
      })
      .returning();

    return NextResponse.json(contribution, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.flatten() }, { status: 400 });
    }
    console.error('Failed to create contribution:', error);
    return NextResponse.json({ error: "Failed to create contribution" }, { status: 500 });
  }
}