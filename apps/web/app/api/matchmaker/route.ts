/**
 * Ubuntu Pools — Matchmaker API
 * Generate prosperity opportunities from social signals
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateProsperityOpportunity, getPoolRecommendations } from '@ubuntu/lindiwe';
import { sovereigntyProxy } from '@ubuntu/sovereignty';

const opportunityRequestSchema = z.object({
  memberId: z.string().uuid(),
  ubuntuScore: z.number().int().min(0).max(100),
  contributionBase: z.number().int().min(0),
  poolHealth: z.number().int().min(0).max(100).default(70),
});

const recommendationRequestSchema = z.object({
  memberId: z.string().uuid(),
  ubuntuScore: z.number().int().min(0).max(100),
  poolHealth: z.number().int().min(0).max(100).default(70),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (request.nextUrl.pathname.endsWith('/opportunity')) {
      const result = opportunityRequestSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: result.error.issues },
          { status: 400 }
        );
      }

      const { memberId, ubuntuScore, contributionBase, poolHealth } = result.data;
      
      const sanitizedProfile = sovereigntyProxy.getSanitizedProfile(memberId);
      
      const opportunity = generateProsperityOpportunity({
        memberId,
        sanitizedProfile,
        ubuntuScore,
        contributionBase,
        poolHealth,
      });

      return NextResponse.json(opportunity);
    }
    
    if (request.nextUrl.pathname.endsWith('/recommendations')) {
      const result = recommendationRequestSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: result.error.issues },
          { status: 400 }
        );
      }

      const { memberId, ubuntuScore, poolHealth } = result.data;
      
      const recommendations = getPoolRecommendations(memberId, ubuntuScore, poolHealth);

      return NextResponse.json({ recommendations });
    }

    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 });
  } catch (error) {
    console.error('Matchmaker API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const memberId = searchParams.get('memberId');
  const ubuntuScore = searchParams.get('ubuntuScore');
  const poolHealth = searchParams.get('poolHealth');

  if (!memberId || !ubuntuScore) {
    return NextResponse.json(
      { error: 'memberId and ubuntuScore are required' },
      { status: 400 }
    );
  }

  const recommendations = getPoolRecommendations(
    memberId,
    parseInt(ubuntuScore),
    poolHealth ? parseInt(poolHealth) : 70
  );

  return NextResponse.json({ recommendations });
}
