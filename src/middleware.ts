import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimits } from "./lib/access/rate-limit";

const isProtectedRoute = createRouteMatcher([
  '/api/(.*)',
  '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
]);

async function middleware(request: NextRequest) {
  // Apply global API rate limiting for all API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    try {
      const ip = request.headers.get('x-forwarded-for') ||
                 request.headers.get('x-real-ip') ||
                 'anonymous';

      const { success } = await rateLimits.api.limit(ip);

      if (!success) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            message: "Too many API requests. Please try again later.",
            retryAfter: "1 minute"
          },
          {
            status: 429,
            headers: {
              'Retry-After': '60',
              'X-RateLimit-Limit': '100',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString()
            }
          }
        );
      }
    } catch (error) {
      // If rate limiting fails, allow the request to continue
      console.error('Rate limiting error:', error);
    }
  }

  return clerkMiddleware()(request, {} as any);
}

export default middleware;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
