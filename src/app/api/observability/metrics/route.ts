import { NextResponse } from 'next/server';
import { getTransparencyMetrics } from '@/lib/observability/service';

export async function GET() {
  try {
    const metrics = getTransparencyMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve transparency metrics' },
      { status: 500 }
    );
  }
}
