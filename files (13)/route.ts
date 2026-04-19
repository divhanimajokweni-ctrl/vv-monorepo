/**
 * src/app/api/health/spine/route.ts
 *
 * OPERATIONAL PROOF ENDPOINT
 * Drop into: src/app/api/health/spine/route.ts
 *
 * GET /api/health/spine
 *
 * Returns 200 when all spine components are healthy.
 * Returns 503 when any component is degraded.
 *
 * Check at 2am when something breaks:
 *   curl https://your-domain.vercel.app/api/health/spine | jq
 *
 * Alert condition:
 *   status === "degraded"  OR  spine.projections.unprocessedCount > 0
 */

import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { sql } from "drizzle-orm";

// Thresholds — tune these for your SLA
const PROJECTION_LAG_ALERT_SECONDS = 30;
const UNPROCESSED_EVENTS_ALERT_COUNT = 5;
const AUDIT_LOOKBACK_MINUTES = 60;

interface ComponentHealth {
  status: "ok" | "lag" | "empty" | "stale" | "error";
  [key: string]: unknown;
}

interface SpineHealth {
  status: "healthy" | "degraded";
  checkedAt: string;
  uptimeSeconds?: number;
  spine: {
    database: ComponentHealth;
    ledger: ComponentHealth;
    events: ComponentHealth;
    projections: ComponentHealth;
    audit: ComponentHealth;
  };
}

const startTime = Date.now();

export async function GET(): Promise<NextResponse<SpineHealth>> {
  const checks: SpineHealth["spine"] = {
    database: { status: "error" },
    ledger: { status: "error" },
    events: { status: "error" },
    projections: { status: "error" },
    audit: { status: "error" },
  };

  // ── Database connectivity ──────────────────────────────────────────────────
  try {
    await db.execute(sql`SELECT 1`);
    checks.database = { status: "ok" };
  } catch (err) {
    checks.database = {
      status: "error",
      error: "Postgres connection failed",
      detail: String(err).slice(0, 200),
    };
    // If DB is down, no point checking further
    return buildResponse(checks, startTime);
  }

  // ── Ledger health ──────────────────────────────────────────────────────────
  try {
    const rows = await db.execute(sql`
      SELECT
        COUNT(*)::int                                                AS total_entries,
        EXTRACT(EPOCH FROM (NOW() - MAX(created_at)))::numeric(10,1) AS last_entry_age_seconds
      FROM ledger_entries
    `);
    const row = rows.rows[0] as {
      total_entries: number;
      last_entry_age_seconds: string | null;
    };
    checks.ledger = {
      status: "ok",
      totalEntries: row.total_entries ?? 0,
      lastEntryAgeSeconds: parseFloat(row.last_entry_age_seconds ?? "0"),
    };
  } catch (err) {
    checks.ledger = {
      status: "error",
      error: "ledger_entries table not accessible — run migration 0007",
      detail: String(err).slice(0, 200),
    };
  }

  // ── Domain events health ───────────────────────────────────────────────────
  try {
    const rows = await db.execute(sql`
      SELECT
        COUNT(*)::int                                                AS total_events,
        EXTRACT(EPOCH FROM (NOW() - MAX(created_at)))::numeric(10,1) AS last_event_age_seconds
      FROM domain_events
    `);
    const row = rows.rows[0] as {
      total_events: number;
      last_event_age_seconds: string | null;
    };
    checks.events = {
      status: "ok",
      totalEvents: row.total_events ?? 0,
      lastEventAgeSeconds: parseFloat(row.last_event_age_seconds ?? "0"),
    };
  } catch (err) {
    checks.events = {
      status: "error",
      error: "domain_events table not accessible — run migration 0007",
      detail: String(err).slice(0, 200),
    };
  }

  // ── Projection lag — the most critical health signal ───────────────────────
  try {
    const rows = await db.execute(sql`
      SELECT
        MAX(EXTRACT(EPOCH FROM (NOW() - p.refreshed_at)))::numeric(10,1) AS max_lag_seconds,
        (
          SELECT COUNT(*)::int
          FROM domain_events de
          JOIN projections p2 ON p2.village_id = de.village_id
          WHERE de.created_at > p2.refreshed_at
        ) AS unprocessed_count,
        COUNT(p.village_id)::int AS village_count
      FROM projections p
    `);
    const row = rows.rows[0] as {
      max_lag_seconds: string | null;
      unprocessed_count: number | null;
      village_count: number;
    };

    const maxLag = parseFloat(row.max_lag_seconds ?? "0");
    const unprocessed = row.unprocessed_count ?? 0;
    const isLagging =
      maxLag > PROJECTION_LAG_ALERT_SECONDS ||
      unprocessed > UNPROCESSED_EVENTS_ALERT_COUNT;

    checks.projections = {
      status: isLagging ? "lag" : "ok",
      maxLagSeconds: maxLag,
      unprocessedCount: unprocessed,
      villageCount: row.village_count,
      alertThresholdSeconds: PROJECTION_LAG_ALERT_SECONDS,
    };
  } catch (err) {
    checks.projections = {
      status: "error",
      error: "projections table not accessible — run migration 0007",
      detail: String(err).slice(0, 200),
    };
  }

  // ── Audit log completeness ─────────────────────────────────────────────────
  try {
    const rows = await db.execute(sql`
      SELECT
        COUNT(al.id)::int                                              AS total_traces,
        EXTRACT(EPOCH FROM (NOW() - MAX(al.recorded_at)))::numeric(10,1) AS last_trace_age_seconds,
        (
          SELECT COUNT(*)::int
          FROM domain_events de
          LEFT JOIN audit_log al2 ON al2.event_id = de.id
          WHERE al2.id IS NULL
            AND de.created_at > NOW() - INTERVAL '${AUDIT_LOOKBACK_MINUTES} minutes'
        ) AS events_without_audit_trace
      FROM audit_log al
    `);
    const row = rows.rows[0] as {
      total_traces: number;
      last_trace_age_seconds: string | null;
      events_without_audit_trace: number;
    };

    const untraced = row.events_without_audit_trace ?? 0;
    checks.audit = {
      status: untraced > 0 ? "stale" : "ok",
      totalTraces: row.total_traces ?? 0,
      lastTraceAgeSeconds: parseFloat(row.last_trace_age_seconds ?? "0"),
      eventsWithoutAuditTrace: untraced,
      lookbackMinutes: AUDIT_LOOKBACK_MINUTES,
    };
  } catch (err) {
    checks.audit = {
      status: "error",
      error: "audit_log table not accessible — run migration 0007",
      detail: String(err).slice(0, 200),
    };
  }

  return buildResponse(checks, startTime);
}

function buildResponse(
  checks: SpineHealth["spine"],
  processStartTime: number
): NextResponse<SpineHealth> {
  const allOk = Object.values(checks).every((c) => c.status === "ok");

  const body: SpineHealth = {
    status: allOk ? "healthy" : "degraded",
    checkedAt: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - processStartTime) / 1000),
    spine: checks,
  };

  return NextResponse.json(body, { status: allOk ? 200 : 503 });
}
