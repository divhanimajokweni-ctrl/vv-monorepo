/**
 * Ubuntu Pools — Credit Eligibility API
 * Check member credit eligibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { creditService } from '@ubuntu/credit';
import { z } from 'zod';

const eligibilityRequestSchema = z.object({
  poolId: z.string().uuid(),
  memberId: z.string().uuid(),
  ubuntuScore: z.number().int().min(0).max(100),
  contributionBase: z.number().int().min(0),
  contributionWindowDays: z.number().int().min(0),
  existingExposure: z.number().int().min(0).default(0),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = eligibilityRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.issues },
        { status: 400 }
      );
    }

    const poolConfig = creditService.getPoolConfig(result.data.poolId);
    if (!poolConfig) {
      return NextResponse.json(
        { error: 'Credit pool not found' },
        { status: 404 }
      );
    }

    const eligibility = creditService.checkEligibility({
      ...result.data,
      poolPhase: poolConfig.currentPhase,
      poolHealthScore: poolConfig.poolHealthScore,
      creditActivated: poolConfig.creditActivated,
    });

    return NextResponse.json(eligibility);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check eligibility' },
      { status: 500 }
    );
  }
}
