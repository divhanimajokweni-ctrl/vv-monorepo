/**
 * Ubuntu Pools — Credit API Routes
 * REST endpoints for credit facilities management
 * 
 * Security fixes applied:
 * - Authentication required for all endpoints
 * - Rate limiting on POST endpoint
 * - Input validation bounds checking
 */

import { NextRequest, NextResponse } from 'next/server';
import { creditService, CreditPoolConfigSchema } from '@ubuntu/credit';
import { requireAuth, generateToken } from '@ubuntu/auth/middleware';

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);
  
  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  record.count++;
  return true;
}

function sanitizePoolId(poolId: string | null): string | null {
  if (!poolId) return null;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(poolId) || poolId.length > 128) {
    return null;
  }
  
  return poolId;
}

export async function POST(request: NextRequest) {
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json(
      { error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }
  
  try {
    const authResult = requireAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: authResult.error },
        { status: 401 }
      );
    }
    
    if (authResult.user.role !== 'admin' && authResult.user.role !== 'system') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only administrators can initialize credit pools' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const result = CreditPoolConfigSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: result.error.issues },
        { status: 400 }
      );
    }

    const poolConfig = creditService.initializePool(result.data);
    return NextResponse.json(poolConfig, { status: 201 });
  } catch (error) {
    console.error('[POST /api/credit/pools] Error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to initialize credit pool' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: authResult.error },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const poolId = sanitizePoolId(searchParams.get('poolId'));

    if (!poolId) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Valid poolId is required' },
        { status: 400 }
      );
    }

    const config = creditService.getPoolConfig(poolId);
    if (!config) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Credit pool not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('[GET /api/credit/pools] Error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to retrieve credit pool' },
      { status: 500 }
    );
  }
}
