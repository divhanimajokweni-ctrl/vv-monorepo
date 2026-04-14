import { NextRequest, NextResponse } from 'next/server';
import { IntrusionDetector, BreachResponse } from '@/lib/security';

export function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  // Check if IP is blocked
  if (BreachResponse.isBlocked(ip)) {
    return new NextResponse('Access denied', { status: 403 });
  }

  // Detect intrusion patterns
  if (IntrusionDetector.detectIntrusion(request)) {
    IntrusionDetector.logSuspiciousActivity(request, ip);
    BreachResponse.recordFailedAttempt(ip);
    return new NextResponse('Suspicious activity detected', { status: 400 });
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/health (health check)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/health|_next/static|_next/image|favicon.ico).*)',
  ],
};