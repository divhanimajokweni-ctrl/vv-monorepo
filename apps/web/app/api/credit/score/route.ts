/**
 * Ubuntu Pools — Ubuntu Score API
 * Calculate member Ubuntu Score based on contribution behavior and pool health
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { creditService } from '@ubuntu/credit';

const contributionPeriodSchema = z.object({
  period: z.number().int().positive(),
  required: z.number().int().min(0),
  paid: z.number().int().min(0),
  ontime: z.boolean(),
  missed: z.boolean(),
});

const ubuntuScoreRequestSchema = z.object({
  memberId: z.string().uuid(),
  poolId: z.string().uuid(),
  periods: z.array(contributionPeriodSchema).min(1),
  includePoolHealth: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = ubuntuScoreRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.issues },
        { status: 400 }
      );
    }

    const { memberId, poolId, periods, includePoolHealth } = result.data;

    const poolConfig = creditService.getPoolConfig(poolId);
    if (!poolConfig) {
      return NextResponse.json(
        { error: 'Pool not found' },
        { status: 404 }
      );
    }

    const poolHealthInput = creditService.getPoolHealthInput(poolId);
    
    if (!poolHealthInput && includePoolHealth) {
      return NextResponse.json(
        { error: 'Unable to calculate pool health' },
        { status: 500 }
      );
    }

    const scoreResult = creditService.calculateUbuntuScoreForMember(
      memberId,
      poolId,
      periods
    );

    return NextResponse.json({
      memberId,
      poolId,
      ubuntuScore: scoreResult.score,
      breakdown: {
        memberCore: scoreResult.memberCore,
        poolMultiplier: scoreResult.poolMultiplier,
        components: scoreResult.components,
      },
      poolHealth: includePoolHealth ? {
        score: Math.round(scoreResult.poolHealth * 100),
        bufferStrength: scoreResult.poolComponents.bufferStrength,
        defaultStrength: scoreResult.poolComponents.defaultStrength,
      } : undefined,
      calculatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to calculate Ubuntu Score' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const memberId = searchParams.get('memberId');
  const poolId = searchParams.get('poolId');

  if (!memberId || !poolId) {
    return NextResponse.json(
      { error: 'memberId and poolId are required' },
      { status: 400 }
    );
  }

  const poolConfig = creditService.getPoolConfig(poolId);
  if (!poolConfig) {
    return NextResponse.json(
      { error: 'Pool not found' },
      { status: 404 }
    );
  }

  const scoreResult = creditService.calculateUbuntuScoreForMember(
    memberId,
    poolId,
    []
  );

  return NextResponse.json({
    memberId,
    poolId,
    ubuntuScore: scoreResult.score,
    memberCore: scoreResult.memberCore,
    poolMultiplier: scoreResult.poolMultiplier,
    poolHealth: Math.round(scoreResult.poolHealth * 100),
  });
}
