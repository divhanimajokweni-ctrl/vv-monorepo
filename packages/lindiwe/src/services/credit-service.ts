import { db } from "@ubuntu/db/client";
import { ubuntuScores, contributions } from "@ubuntu/db/schema";
import { eq } from "drizzle-orm";

export interface MemberContributionHistory {
  memberId: string;
  totalContributions: number;
  periods: { start: Date; end: Date; amount: number }[];
}

export interface PoolHealthInput {
  poolId: string;
  totalValue: number;
  bufferBalance?: number;
  transactions?: { amount: number; date: string }[];
}

export async function calculateUbuntuScore(memberId: string): Promise<number> {
  const score = await db.select({ score: ubuntuScores.score }).from(ubuntuScores).where(eq(ubuntuScores.memberId, memberId)).limit(1);
  return score[0]?.score ?? 50;
}

export async function calculatePoolHealthFromInput(input: PoolHealthInput): Promise<number> {
  if (input.bufferBalance && input.bufferBalance < 0) return 20;
  return input.totalValue > 0 ? 80 : 20;
}