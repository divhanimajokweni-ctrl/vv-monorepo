/**
 * Ubuntu Pools — Phase 1: Account Balance API Route
 *
 * GET /api/ledger/accounts/[id]/balance — Get account balance
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@ubuntu/db/client";
import { createEventService } from "@ubuntu/domain-core";
import { createLedgerService } from "@ubuntu/ledger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "Invalid account ID format" },
        { status: 400 }
      );
    }

    const eventService = createEventService(db);
    const ledgerService = createLedgerService(db, eventService);

    const balance = await ledgerService.getAccountBalance(id);

    if (!balance) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: `Account ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ balance });
  } catch (error) {
    console.error("[GET /api/ledger/accounts/[id]/balance] Unexpected error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
