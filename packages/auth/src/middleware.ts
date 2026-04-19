/**
 * Ubuntu Pools — Authentication Middleware
 * Provides auth utilities for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export interface AuthUser {
  id: string;
  email: string;
  role: 'member' | 'admin' | 'system';
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

const PUBLIC_PATHS = [
  '/api/health',
  '/api/observability/health',
];

const PUBLIC_API_PATHS = [
  '/api/events',
  '/api/ledger/accounts',
];

function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1]!;
}

function verifyToken(token: string): AuthUser | null {
  if (!token || token.length < 10) return null;
  
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    
    if (!payload.userId || !payload.expiresAt) return null;
    
    if (new Date(payload.expiresAt) < new Date()) return null;
    
    return {
      id: payload.userId,
      email: payload.email || `${payload.userId}@ubuntu-pools.local`,
      role: payload.role || 'member',
    };
  } catch {
    return null;
  }
}

export function authenticateRequest(request: NextRequest): AuthResult {
  const path = request.nextUrl.pathname;
  
  for (const publicPath of PUBLIC_PATHS) {
    if (path === publicPath || path.startsWith(publicPath + '/')) {
      return { success: true, user: { id: 'public', email: 'public@localhost', role: 'system' } };
    }
  }
  
  const authHeader = request.headers.get('authorization');
  const token = extractToken(authHeader);
  
  if (!token) {
    return { success: false, error: 'Missing authentication token' };
  }
  
  const user = verifyToken(token);
  if (!user) {
    return { success: false, error: 'Invalid or expired token' };
  }
  
  return { success: true, user };
}

export function requireAuth(request: NextRequest): AuthResult {
  const result = authenticateRequest(request);
  
  if (!result.success) {
    return result;
  }
  
  if (result.user?.id === 'public') {
    return { success: false, error: 'Authentication required' };
  }
  
  return result;
}

export function requireRole(request: NextRequest, allowedRoles: AuthUser['role'][]): AuthResult {
  const authResult = requireAuth(request);
  
  if (!authResult.success || !authResult.user) {
    return authResult;
  }
  
  if (!allowedRoles.includes(authResult.user.role)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  
  return authResult;
}

export function withAuth(
  handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>,
  options?: {
    allowedRoles?: AuthUser['role'][];
    public?: boolean;
  }
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    if (options?.public) {
      return handler(request, { id: 'public', email: 'public@localhost', role: 'system' });
    }
    
    const authResult = options?.allowedRoles 
      ? requireRole(request, options.allowedRoles)
      : requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: authResult.error },
        { status: 401 }
      );
    }
    
    return handler(request, authResult.user);
  };
}

export function generateToken(userId: string, email?: string, role?: AuthUser['role']): string {
  const payload = {
    userId,
    email,
    role,
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    nonce: randomUUID(),
  };
  
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}
