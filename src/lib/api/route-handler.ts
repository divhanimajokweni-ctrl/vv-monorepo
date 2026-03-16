import { NextRequest, NextResponse } from "next/server";
import { z, ZodSchema, ZodError } from "zod";
import {
  formatApiError,
  formatZodError,
  formatUnauthorizedError,
  type ApiError,
} from "./error-formatter";

export type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RouteHandlerOptions {
  schema?: ZodSchema;
  requireAuth?: boolean;
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(ip: string, windowMs: number, maxRequests: number): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

export type AuthFunction = (request: NextRequest) => { userId: string | null; error?: string };

let defaultAuthFunction: AuthFunction | null = null;

export function setDefaultAuth(authFn: AuthFunction): void {
  defaultAuthFunction = authFn;
}

export function withApiHandler(
  handler: (request: NextRequest, params: Record<string, string>) => Promise<NextResponse>,
  options: RouteHandlerOptions = {}
) {
  return async (request: NextRequest, params: Record<string, string> = {}): Promise<NextResponse> => {
    try {
      if (options.rateLimit) {
        const ip = request.headers.get("x-forwarded-for") || "unknown";
        if (!checkRateLimit(ip, options.rateLimit.windowMs, options.rateLimit.maxRequests)) {
          return NextResponse.json(
            formatApiError("RATE_LIMIT_EXCEEDED", "Too many requests", 429),
            { status: 429 }
          );
        }
      }

      if (options.requireAuth) {
        const authFn = defaultAuthFunction;
        if (!authFn) {
          return NextResponse.json(
            formatUnauthorizedError("Authentication not configured"),
            { status: 500 }
          );
        }

        const authResult = authFn(request);
        if (!authResult.userId) {
          return NextResponse.json(
            formatUnauthorizedError(authResult.error || "Authentication required"),
            { status: 401 }
          );
        }
      }

      let body: unknown = undefined;
      if (request.method !== "GET" && request.method !== "HEAD") {
        body = await request.json();
      }

      if (options.schema && body !== undefined) {
        try {
          options.schema.parse(body);
        } catch (error) {
          if (error instanceof ZodError) {
            return NextResponse.json(formatZodError(error), { status: 400 });
          }
          throw error;
        }
      }

      return await handler(request, params);
    } catch (error) {
      console.error("[API Handler] Unexpected error:", error);
      return NextResponse.json(
        formatApiError("INTERNAL_ERROR", "An unexpected error occurred", 500),
        { status: 500 }
      );
    }
  };
}

export function validateBody<T extends ZodSchema>(
  schema: T,
  body: unknown
): { success: true; data: z.infer<T> } | { success: false; error: ApiError } {
  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      success: false,
      error: formatZodError(result.error),
    };
  }
  return {
    success: true,
    data: result.data,
  };
}

export function validateQuery<T extends ZodSchema>(
  schema: T,
  searchParams: URLSearchParams
): { success: true; data: z.infer<T> } | { success: false; error: ApiError } {
  const queryObj: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    queryObj[key] = value;
  });

  const result = schema.safeParse(queryObj);
  if (!result.success) {
    return {
      success: false,
      error: formatZodError(result.error),
    };
  }
  return {
    success: true,
    data: result.data,
  };
}
