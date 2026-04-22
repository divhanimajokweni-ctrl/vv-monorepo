import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { villages, members } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const CreateVillageSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  contributionAmount: z.number().min(1), // in cents
  cycleWeeks: z.number().min(1).default(4),
});

// GET /api/villages - List villages for current user
export async function GET() {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get villages where user is a member
    const userVillages = await db
      .select({
        id: villages.id,
        name: villages.name,
        description: villages.description,
        contributionAmount: villages.contributionAmount,
        cycleWeeks: villages.cycleWeeks,
        createdAt: villages.createdAt,
        role: members.role,
      })
      .from(members)
      .innerJoin(villages, eq(members.villageId, villages.id))
      .where(eq(members.userId, user.id));

    return NextResponse.json(userVillages);
  } catch (error) {
    console.error('Failed to fetch villages:', error);
    return NextResponse.json({ error: "Failed to fetch villages" }, { status: 500 });
  }
}

// POST /api/villages - Create a new village
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = CreateVillageSchema.parse(body);

    // Create village
    const [village] = await db
      .insert(villages)
      .values({
        name: validatedData.name,
        description: validatedData.description,
        contributionAmount: validatedData.contributionAmount,
        cycleWeeks: validatedData.cycleWeeks,
      })
      .returning();

    // Add creator as admin member
    await db.insert(members).values({
      userId: user.id,
      villageId: village.id,
      role: 'admin',
    });

    return NextResponse.json(village, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.flatten() }, { status: 400 });
    }
    console.error('Failed to create village:', error);
    return NextResponse.json({ error: "Failed to create village" }, { status: 500 });
  }
}
