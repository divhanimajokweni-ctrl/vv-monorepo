import { NextRequest, NextResponse } from 'next/server';
import { BreachResponse } from '@/lib/security';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  try {
    const { action } = await request.json();

    if (action === 'admin_login_failed') {
      BreachResponse.recordFailedAttempt(ip);
      return NextResponse.json({ status: 'logged' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}