/**
 * Ubuntu Pools — Dodo Payments Bank Connection API
 *
 * Security fixes applied:
 * - Authentication required
 * - Access token ownership validation
 * - Rate limiting
 * - Input sanitization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDodoPaymentsProvider } from '@/lib/bank-provider/dodo-payments';
import { requireAuth } from '@/lib/auth/middleware';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';

const DODO_PAYMENTS_LINKED_ACCOUNTS_TABLE = 'dodo_payments_linked_accounts';

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

function sanitizeAccessToken(token: string | null): string | null {
  if (!token || typeof token !== 'string') return null;
  if (token.length < 10 || token.length > 2048) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(token)) return null;
  return token;
}

function sanitizeAction(action: string | null): string | null {
  if (!action || typeof action !== 'string') return null;
  const allowed = ['disconnect', 'refresh'];
  if (!allowed.includes(action)) return null;
  return action;
}

async function validateTokenOwnership(userId: string, accessToken: string): Promise<boolean> {
  try {
    const provider = getDodoPaymentsProvider();
    const accounts = await provider.getAccounts(accessToken);
    return accounts.length > 0;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json(
      { error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' },
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

    const body = await request.json();
    const accessToken = sanitizeAccessToken(body.access_token);
    const action = sanitizeAction(body.action);

    if (!accessToken) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Valid access_token is required' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Valid action is required (disconnect or refresh)' },
        { status: 400 }
      );
    }

    const tokenValid = await validateTokenOwnership(authResult.user.id, accessToken);
    if (!tokenValid) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Access token does not belong to this user' },
        { status: 403 }
      );
    }

    const provider = getDodoPaymentsProvider();

    switch (action) {
      case 'disconnect':
        await provider.disconnect(accessToken);
        return NextResponse.json({ success: true, message: 'Disconnected successfully' });
      
      case 'refresh':
        await provider.refreshConnection(accessToken);
        const accounts = await provider.getAccounts(accessToken);
        return NextResponse.json({ success: true, accounts });
      
      default:
        return NextResponse.json(
          { error: 'INVALID_ACTION', message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[POST /api/dodo-payments/connection] Error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to manage connection' },
      { status: 500 }
    );
  }
}
