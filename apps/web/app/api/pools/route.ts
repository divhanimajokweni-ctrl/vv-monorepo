import { NextResponse } from 'next/server';
import { db } from '@ubuntu/db/client';
import { pools } from '@ubuntu/db/schema';
import { inArray } from 'drizzle-orm';

export async function GET() {
  try {
    const activePools = await db
      .select({
        id:             pools.id,
        name:           pools.name,
        description:    pools.description,
        targetAmount:   pools.targetAmount,
        currentAmount:  pools.currentAmount,
        minStake:       pools.minStake,
        status:         pools.status,
        lockInMonths:   pools.lockInMonths,
        expectedYield:  pools.expectedYield,
        opensAt:        pools.opensAt,
      })
      .from(pools)
      .where(inArray(pools.status, ['open', 'active']));

    return NextResponse.json({ pools: activePools });
  } catch (e) {
    console.error('[pools] fetch error:', e);
    return NextResponse.json({ error: 'Could not fetch pools' }, { status: 500 });
  }
}