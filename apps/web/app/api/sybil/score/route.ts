import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { evaluateUser } from "@ubuntu/reputation/decision-engine";
import { computeTimeTrustSignal } from "@ubuntu/reputation/time-trust";
import { computeDiversitySignal } from "@ubuntu/reputation/diversity-scoring";
import { computeDeviceBindingSignal } from "@ubuntu/reputation/device-binding";
import { computeHumanVerificationSignal } from "@ubuntu/reputation/human-verification";
import { computeEconomicActivitySignal, computeTransactionFrictionSignal } from "@ubuntu/reputation/economic-activity";
import { computeSocialAnchorSignal } from "@ubuntu/reputation/social-anchors";
import { computeVillageShieldSignal } from "@ubuntu/reputation/village-shield";
import { computeGrowthSignal } from "@ubuntu/reputation/growth-limits";
import type { SybilSignals, VerificationLevel } from "@ubuntu/reputation/types";

const querySchema = z.object({
  userId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const parsed = querySchema.safeParse({ userId: searchParams.get("userId") });

    if (!parsed.success) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const { userId } = parsed.data;

    // In production these would come from DB queries; defaults here for the API shape
    const profile = {
      accountCreatedAt: new Date(),
      verificationLevel: "level_0" as VerificationLevel,
      deviceKeyCount: 0,
      sponsorId: null as string | null,
      inviteDepth: 0,
      sponsorScore: 0,
      loanCount: 0,
      repaymentCount: 0,
      savingsContributions: 0,
      totalTransactions: 0,
      uniqueCounterparties: 0,
      villageScore: 0,
      memberFlaggedCount: 0,
      totalMembers: 0,
      scoreHistory: [] as { date: string; score: number }[],
      currentScore: 0,
    };

    const accountAgeDays = (Date.now() - profile.accountCreatedAt.getTime()) / (1000 * 60 * 60 * 24);

    const signals: SybilSignals = {
      deviceBinding: computeDeviceBindingSignal(profile.deviceKeyCount),
      humanVerification: computeHumanVerificationSignal(profile.verificationLevel),
      socialAnchor: computeSocialAnchorSignal({
        sponsorId: profile.sponsorId,
        inviteDepth: profile.inviteDepth,
        sponsorScore: profile.sponsorScore,
      }),
      economicActivity: computeEconomicActivitySignal({
        accountAgeDays,
        loanCount: profile.loanCount,
        repaymentCount: profile.repaymentCount,
        savingsContributions: profile.savingsContributions,
      }),
      graphAnalysis: 0.5, // placeholder — requires full graph computation
      transactionFriction: computeTransactionFrictionSignal({
        totalTransactions: profile.totalTransactions,
        minTransactions: 5,
      }),
      reputationGrowth: computeGrowthSignal({
        scoreHistory: profile.scoreHistory,
        currentScore: profile.currentScore,
      }),
      interactionDiversity: computeDiversitySignal({
        uniqueCounterparties: profile.uniqueCounterparties,
        totalTransactions: profile.totalTransactions,
      }),
      timeTrust: computeTimeTrustSignal(profile.accountCreatedAt),
      villageShield: computeVillageShieldSignal({
        villageScore: profile.villageScore,
        memberFlaggedCount: profile.memberFlaggedCount,
        totalMembers: profile.totalMembers,
      }),
    };

    const verdict = evaluateUser({
      userId,
      signals,
      verificationLevel: profile.verificationLevel,
    });

    return NextResponse.json(verdict);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
