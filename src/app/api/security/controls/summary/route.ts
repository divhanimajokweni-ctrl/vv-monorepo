/**
 * Ubuntu Pools — Security Controls Summary API
 * Get control summary, maturity score, and high-priority gaps
 */

import { NextRequest, NextResponse } from 'next/server';
import { securityControlsService } from '@/lib/services/security-controls-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'summary';
    
    switch (type) {
      case 'summary': {
        const summary = await securityControlsService.getControlSummary();
        return NextResponse.json(summary);
      }
      
      case 'gaps': {
        const gaps = await securityControlsService.getHighPriorityGaps();
        return NextResponse.json({ gaps });
      }
      
      case 'frameworks': {
        const frameworks = await securityControlsService.getFrameworks();
        return NextResponse.json({ frameworks });
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid type parameter. Use: summary, gaps, or frameworks' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Failed to fetch control data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch control data' },
      { status: 500 }
    );
  }
}
