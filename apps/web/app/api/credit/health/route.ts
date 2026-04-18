/**
 * Ubuntu Pools — Credit Pool Health API
 * Get pool health metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { creditService } from '@/lib/services/credit-service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const poolId = searchParams.get('poolId');

  if (!poolId) {
    return NextResponse.json(
      { error: 'poolId is required' },
      { status: 400 }
    );
  }

  const config = creditService.getPoolConfig(poolId);
  if (!config) {
    return NextResponse.json(
      { error: 'Credit pool not found' },
      { status: 404 }
    );
  }

  const healthMetrics = creditService.calculatePoolHealth(config);

  return NextResponse.json({
    poolId,
    phase: config.currentPhase,
    creditActivated: config.creditActivated,
    ...healthMetrics,
    exposure: config.activeCreditExposure,
    buffer: config.safetyBuffer,
    capital: config.totalPoolCapital,
  });
}
