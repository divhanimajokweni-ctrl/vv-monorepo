/**
 * Ubuntu Pools — Phase 1: Single Event API Route
 *
 * GET /api/events/[id]         — Get a single event by ID
 * GET /api/events/[id]/verify  — Verify a single event's hash
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { createEventService } from "@/lib/services/event-service";

// =============================================================================
// GET /api/events/[id] — Get a single event
// =============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Basic UUID format check
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "Invalid event ID format" },
        { status: 400 }
      );
    }

    const service = createEventService(db);
    const event = await service.getEvent(id);

    if (!event) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: `Event ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      event: {
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
      },
    });
  } catch (error) {
    console.error("[GET /api/events/[id]] Unexpected error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
