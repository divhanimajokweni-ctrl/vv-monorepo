/**
 * apps/web/app/api/health/spine/route.ts
 *
 * OPERATIONAL PROOF endpoint.
 *
 * Returns the health of every spine component.
 * This endpoint should be the first thing checked when something breaks at 2am.
 *
 * GET /api/health/spine
 *
 * Healthy response (200):
 * {
 *   "status": "healthy",
 *   "spine": {
 *     "ledger": { "status": "ok", "lastEntryAge": 42 },
 *     "events": { "status": "ok", "unprocessedCount": 0 },
 *     "projections": { "status": "ok", "maxLagSeconds": 3.2 },
 *     "audit": { "status": "ok", "lastTraceAge": 41 },
 *     "notifications": { "status": "ok", "failureRate": 0.0 }
 *   }
 * }
 *
 * Degraded response (503):
 * {
 *   "status": "degraded",
 *   "spine": {
 *     "projections": { "status": "lag", "maxLagSeconds": 87.4, "unprocessedCount": 12 }
 *     ...
 *   }
 * }
 */

import { NextResponse } from "next/server";
import { db } from "@ubuntu/db/client";
import { ledgerEntries, domainEvents, projections, auditLog } from "@ubuntu/db/schema-spine";
import { sql } from "drizzle-orm";

const PROJECTION_LAG_ALERT_SECONDS = 30;
const UNPROCESSED_EVENTS_ALERT_COUNT = 5;

interface ComponentHealth {
  status: "ok" | "lag" | "empty" | "error";
  [key: string]: unknown;
}

interface SpineHealth {
  status: "healthy" | "degraded";
  checkedAt: string;
  spine: {
    ledger: ComponentHealth;
    events: ComponentHealth;
    projections: ComponentHealth;
    audit: ComponentHealth;
  };
}

export async function GET(): Promise<NextResponse<SpineHealth>> {
  const checks: SpineHealth["spine"] = {
    ledger: { status: "error" },
    events: { status: "error" },
    projections: { status: "error" },
    audit: { status: "error" },
  };

  // ── Ledger health ──────────────────────────────────────────────────────────
  try {
    const result = await db.execute(sql`
      SELECT
        COUNT(*) as total_entries,
        EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) as last_entry_age_seconds
      FROM ledger_entries
    `);
    const row = result.rows[0] as Record<string, unknown>;
    checks.ledger = {
      status: "ok",
      totalEntries: Number(row.total_entries ?? 0),
      lastEntryAgeSeconds: Number((row.last_entry_age_seconds ?? 0)).toFixed(1),
    };
  } catch (err) {
    checks.ledger = { status: "error", error: String(err) };
  }

  // ── Events health ──────────────────────────────────────────────────────────
  try {
    const result = await db.execute(sql`
      SELECT
        COUNT(*) as total_events,
        EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) as last_event_age_seconds
      FROM domain_events
    `);
    const row = result.rows[0] as Record<string, unknown>;
    checks.events = {
      status: "ok",
      totalEvents: Number(row.total_events ?? 0),
      lastEventAgeSeconds: Number((row.last_event_age_seconds ?? 0)).toFixed(1),
    };
  } catch (err) {
    checks.events = { status: "error", error: String(err) };
  }

  // ── Projection lag (the critical health signal) ────────────────────────────
  try {
    const result = await db.execute(sql`
      SELECT
        MAX(EXTRACT(EPOCH FROM (NOW() - refreshed_at))) as max_lag_seconds,
        (
          SELECT COUNT(*)
          FROM domain_events de
          JOIN projections p ON p.village_id = de.village_id
          WHERE de.created_at > p.refreshed_at
        ) as unprocessed_count
      FROM projections
    `);
    const row = result.rows[0] as Record<string, unknown>;
    const maxLag = Number(row.max_lag_seconds ?? 0);
    const unprocessed = Number(row.unprocessed_count ?? 0);

    const isLagging =
      maxLag > PROJECTION_LAG_ALERT_SECONDS ||
      unprocessed > UNPROCESSED_EVENTS_ALERT_COUNT;

    checks.projections = {
      status: isLagging ? "lag" : "ok",
      maxLagSeconds: maxLag.toFixed(1),
      unprocessedCount: unprocessed,
      alertThresholdSeconds: PROJECTION_LAG_ALERT_SECONDS,
    };
  } catch (err) {
    checks.projections = { status: "error", error: String(err) };
  }

  // ── Audit log completeness ─────────────────────────────────────────────────
  try {
    const result = await db.execute(sql`
      SELECT
        COUNT(*) as total_traces,
        EXTRACT(EPOCH FROM (NOW() - MAX(recorded_at))) as last_trace_age_seconds,
        (
          SELECT COUNT(*)
          FROM domain_events de
          LEFT JOIN audit_log al ON al.event_id = de.id
          WHERE al.id IS NULL
          AND de.created_at > NOW() - INTERVAL '1 hour'
        ) as events_without_audit_trace
      FROM audit_log
    `);
    const row = result.rows[0] as Record<string, unknown>;
    const untraced = Number(row.events_without_audit_trace ?? 0);

    checks.audit = {
      status: untraced > 0 ? "error" : "ok",
      totalTraces: Number(row.total_traces ?? 0),
      lastTraceAgeSeconds: Number((row.last_trace_age_seconds ?? 0)).toFixed(1),
      eventsWithoutAuditTrace: untraced,
    };
  } catch (err) {
    checks.audit = { status: "error", error: String(err) };
  }

  // ── Overall status ─────────────────────────────────────────────────────────
  const allOk = Object.values(checks).every((c) => c.status === "ok");

  const health: SpineHealth = {
    status: allOk ? "healthy" : "degraded",
    checkedAt: new Date().toISOString(),
    spine: checks,
  };

  return NextResponse.json(health, { status: allOk ? 200 : 503 });
}
