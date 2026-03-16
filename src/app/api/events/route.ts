/**
 * Ubuntu Pools — Phase 1: Events API Route
 *
 * POST /api/events — Emit a new event
 * GET  /api/events — List recent events (with optional filters)
 *
 * Governance Charter Compliance:
 *   - All inputs validated server-side before any DB write.
 *   - No client-side authority — server enforces all rules.
 *   - Responses never expose internal stack traces in production.
 *   - All monetary values in responses are integer minor units.
 *
 * Security fixes:
 *   - Authentication required for POST (event creation)
 *   - Authentication required for GET with detailed filters
 *   - Bounds checking on limit/offset parameters
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { createEventService, EventValidationError, EventDuplicateError } from "@/lib/services/event-service";
import { createEventInputSchema } from "@/lib/events/schemas";
import { requireAuth, generateToken } from "@/lib/auth/middleware";

function sanitizeLimit(value: string | null, defaultVal: number, maxVal: number): number {
  const parsed = parseInt(value ?? String(defaultVal), 10);
  if (isNaN(parsed) || parsed < 1) return defaultVal;
  return Math.min(parsed, maxVal);
}

function sanitizeOffset(value: string | null): number {
  const parsed = parseInt(value ?? "0", 10);
  if (isNaN(parsed) || parsed < 0) return 0;
  return Math.min(parsed, 100000);
}

function sanitizeString(value: string | null, maxLength: number): string | undefined {
  if (!value) return undefined;
  const sanitized = value.slice(0, maxLength);
  if (!/^[a-z][a-z0-9_.]*$/.test(sanitized)) return undefined;
  return sanitized;
}

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;
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

// =============================================================================
// POST /api/events — Emit a new event
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const clientIP = request.headers.get("x-forwarded-for") || "unknown";
  
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json(
      { error: "RATE_LIMIT_EXCEEDED", message: "Too many requests" },
      { status: 429 }
    );
  }
  
  try {
    const authResult = requireAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: authResult.error },
        { status: 401 }
      );
    }

    const body = await request.json();

    const parsed = createEventInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: "Event input validation failed",
          details: parsed.error.issues.map((e) => ({
            path: Array.from(e.path).map(String).join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const service = createEventService(db);
    const result = await service.emit(parsed.data);

    return NextResponse.json(
      {
        event: serializeEvent(result.event),
        wasNew: result.wasNew,
      },
      { status: result.wasNew ? 201 : 200 }
    );
  } catch (error) {
    if (error instanceof EventValidationError) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: error.message,
          details: error.validationErrors,
        },
        { status: 400 }
      );
    }

    if (error instanceof EventDuplicateError) {
      return NextResponse.json(
        {
          error: "DUPLICATE_EVENT",
          message: error.message,
          existingEventId: error.existingEventId,
        },
        { status: 409 }
      );
    }

    console.error("[POST /api/events] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET /api/events — List recent events
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = requireAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: authResult.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const limit = sanitizeLimit(searchParams.get("limit"), 50, 200);
    const offset = sanitizeOffset(searchParams.get("offset"));
    const eventType = sanitizeString(searchParams.get("eventType"), 100);
    const statusParam = searchParams.get("status");
    
    let status: "pending" | "posted" | "failed" | undefined;
    if (statusParam && ["pending", "posted", "failed"].includes(statusParam)) {
      status = statusParam as "pending" | "posted" | "failed";
    }

    const service = createEventService(db);
    const events = await service.getRecentEvents({
      limit,
      offset,
      eventType,
      status,
    });

    return NextResponse.json({
      events: events.map(serializeEvent),
      count: events.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[GET /api/events] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// SERIALIZATION HELPER
// =============================================================================

function serializeEvent(event: {
  id: string;
  eventType: string;
  actorId: string;
  entityId: string;
  entityType: string;
  payload: unknown;
  occurredAt: Date;
  sequenceNo: number | bigint;
  hash: string;
  prevHash: string | null;
  status: string;
}) {
  return {
    id: event.id,
    eventType: event.eventType,
    actorId: event.actorId,
    entityId: event.entityId,
    entityType: event.entityType,
    payload: event.payload,
    occurredAt: event.occurredAt.toISOString(),
    sequenceNo: Number(event.sequenceNo),
    hash: event.hash,
    prevHash: event.prevHash,
    status: event.status,
  };
}
