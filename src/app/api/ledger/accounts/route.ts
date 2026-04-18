/**
 * Ubuntu Pools — Phase 1: Ledger Accounts API Route
 *
 * POST /api/ledger/accounts — Open a new ledger account
 * GET  /api/ledger/accounts — List ledger accounts (with optional filters)
 *
 * Security fixes applied:
 * - Authentication required
 * - Rate limiting on POST
 * - Input bounds checking
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@ubuntu/db/client";
import { createEventService } from "@ubuntu/domain-core";
import { createLedgerService } from "@ubuntu/ledger";
import { requireAuth } from "@ubuntu/auth/middleware";

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
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

function sanitizeString(value: string | null, maxLength: number): string | undefined {
  if (!value) return undefined;
  const sanitized = value.slice(0, maxLength);
  return sanitized.length > 0 ? sanitized : undefined;
}

function sanitizeUUID(value: string | null): string | undefined {
  if (!value) return undefined;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value) ? value : undefined;
}

const openAccountSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(50)
    .regex(
      /^[A-Z0-9_-]+$/,
      "Account code must be uppercase alphanumeric with hyphens/underscores"
    ),
  name: z.string().min(1).max(200),
  accountType: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
  currency: z
    .string()
    .length(3)
    .regex(/^[A-Z]{3}$/, "Currency must be 3 uppercase letters"),
  entityId: z.string().uuid().optional(),
  entityType: z.string().optional(),
  actorId: z.string().uuid("actorId must be a valid UUID"),
});

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

    if (authResult.user.role !== 'admin' && authResult.user.role !== 'system') {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Only administrators can create ledger accounts" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const parsed = openAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: "Account input validation failed",
          details: parsed.error.issues.map((e) => ({
            path: Array.from(e.path).map(String).join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const eventService = createEventService(db);
    const ledgerService = createLedgerService(db, eventService);

    const account = await ledgerService.openAccount(parsed.data);

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json(
        { error: "CONFLICT", message: error.message },
        { status: 409 }
      );
    }

    console.error("[POST /api/ledger/accounts] Unexpected error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

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

    const entityId = sanitizeUUID(searchParams.get("entityId"));
    const entityType = sanitizeString(searchParams.get("entityType"), 50);
    const currency = sanitizeString(searchParams.get("currency"), 3);

    const eventService = createEventService(db);
    const ledgerService = createLedgerService(db, eventService);

    const filter = {
      ...(entityId && { entityId }),
      ...(entityType && { entityType }),
      ...(currency && { currency }),
    };
    
    const accounts = await ledgerService.getAccounts(Object.keys(filter).length > 0 ? filter : undefined);

    return NextResponse.json({ accounts, count: accounts.length });
  } catch (error) {
    console.error("[GET /api/ledger/accounts] Unexpected error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
