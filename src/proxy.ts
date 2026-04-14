import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { IntrusionDetector, BreachResponse } from '@/lib/security';

function securityMiddleware(request: NextRequest) {
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

export default clerkMiddleware((auth, req) => {
  // Apply security middleware first
  const securityResponse = securityMiddleware(req);
  if (securityResponse.status !== 200) {
    return securityResponse;
  }

  // Continue with Clerk middleware
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
