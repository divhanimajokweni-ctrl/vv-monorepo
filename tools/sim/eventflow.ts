#!/usr/bin/env npx tsx
/**
 * EventFlow Simulator
 *
 * Generates synthetic events with proper SHA-256 hash chaining (matching
 * the real ledger hasher) and evaluates Lindiwe governance triggers locally.
 *
 * Usage:
 *   npx tsx tools/sim/eventflow.ts [eventsPerSecond] [durationSeconds]
 *   npx tsx tools/sim/eventflow.ts 20 120
 *
 * Outputs events to stdout as NDJSON. Can be piped to files or POST'd
 * to the local API for integration testing.
 *
 * No Redis or database dependency — pure in-memory simulation.
 */

import { createHash, randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// SHA-256 hashing — matches src/lib/events/hasher.ts canonical form
// ---------------------------------------------------------------------------

function sha256(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

function sortKeysRecursive(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(sortKeysRecursive);
  if (typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = sortKeysRecursive((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

function hashEvent(
  event: SimEvent,
  prevHash: string | null,
  sequenceNo: number
): string {
  const canonical = {
    actor_id: event.actor,
    entity_id: event.poolId,
    entity_type: "pool",
    event_type: event.type,
    occurred_at: new Date(event.ts).toISOString(),
    payload: sortKeysRecursive(event.metadata ?? {}),
    prev_hash: prevHash ?? "",
    sequence_no: sequenceNo,
  };
  return sha256(JSON.stringify(canonical));
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EventType = "CONTRIBUTION" | "WITHDRAWAL" | "ATTESTATION" | "FRAUD_SIGNAL";

interface SimMember {
  id: string;
  trust: number;
}

interface SimPool {
  id: string;
  balance: number;
  drain: number;
}

interface SimEvent {
  id: string;
  ts: number;
  actor: string;
  poolId: string;
  type: EventType;
  amount?: number;
  metadata: Record<string, unknown>;
  sequenceNo: number;
  prevHash: string | null;
  hash: string;
}

// ---------------------------------------------------------------------------
// Simulation state
// ---------------------------------------------------------------------------

const MEMBER_COUNT = 250;
const POOL_COUNT = 5;

const members: SimMember[] = Array.from({ length: MEMBER_COUNT }, (_, i) => ({
  id: `member_${i + 1}`,
  trust: Math.random() * 0.6 + 0.2,
}));

const pools: SimPool[] = Array.from({ length: POOL_COUNT }, (_, i) => ({
  id: `pool_${i + 1}`,
  balance: 50_000 + Math.random() * 100_000,
  drain: 0,
}));

let prevHash: string | null = null;
let sequenceNo = 0;

function randEl<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// Event generation
// ---------------------------------------------------------------------------

function makeEvent(): SimEvent {
  const roll = Math.random();
  const type: EventType =
    roll < 0.55
      ? "CONTRIBUTION"
      : roll < 0.82
        ? "WITHDRAWAL"
        : roll < 0.94
          ? "ATTESTATION"
          : "FRAUD_SIGNAL";

  const member = randEl(members);
  const pool = randEl(pools);

  let amount: number | undefined;

  if (type === "CONTRIBUTION") {
    amount = Math.floor(50 + Math.random() * 500);
    pool.balance += amount;
  } else if (type === "WITHDRAWAL") {
    amount = Math.floor(50 + Math.random() * 1200);
    pool.balance -= amount;
    pool.drain += amount;
  } else if (type === "FRAUD_SIGNAL") {
    pool.drain += Math.random() * 2000;
  }

  sequenceNo++;

  const partial: Omit<SimEvent, "hash"> & { hash: string } = {
    id: randomUUID(),
    ts: Date.now(),
    actor: member.id,
    poolId: pool.id,
    type,
    amount,
    metadata: amount != null ? { amount } : {},
    sequenceNo,
    prevHash,
    hash: "",
  };

  partial.hash = hashEvent(partial, prevHash, sequenceNo);
  prevHash = partial.hash;

  return partial as SimEvent;
}

// ---------------------------------------------------------------------------
// Lindiwe-style governance triggers (mirrors src/lib/backbone/lindiwe.ts)
// ---------------------------------------------------------------------------

interface Metrics {
  totalBalance: number;
  totalDrain: number;
  bufferRatio: number;
  reputationAverage: number;
  stability: number;
}

function computeMetrics(): Metrics {
  const totalBalance = pools.reduce((s, p) => s + p.balance, 0);
  const totalDrain = pools.reduce((s, p) => s + p.drain, 0);
  const bufferRatio = Math.min(
    1,
    totalBalance / (POOL_COUNT * 150_000)
  );
  const reputationAverage =
    members.reduce((s, m) => s + m.trust, 0) / members.length;
  const stability = Math.max(0, 1 - totalDrain / Math.max(1, totalBalance));

  return { totalBalance, totalDrain, bufferRatio, reputationAverage, stability };
}

function evaluateTriggers(m: Metrics): string[] {
  const triggers: string[] = [];

  // Emergency: buffer critically low + high instability
  if (m.bufferRatio < 0.1 && m.stability < 0.3) {
    triggers.push("EMERGENCY");
  }
  // Shield: buffer depleted or high drain
  if (m.bufferRatio < 0.25 || m.totalDrain / Math.max(1, m.totalBalance) > 0.5) {
    triggers.push("SHIELD");
  }
  // Prosperity: healthy buffer + good reputation + stable
  if (m.bufferRatio >= 1.0 && m.reputationAverage > 0.75 && m.stability > 0.7) {
    triggers.push("PROSPERITY");
  }

  return triggers;
}

// ---------------------------------------------------------------------------
// Main simulation loop
// ---------------------------------------------------------------------------

async function run(ratePerSec: number, seconds: number): Promise<void> {
  console.error(
    `[EventFlow] Simulating ${ratePerSec} events/s for ${seconds}s ` +
    `(${MEMBER_COUNT} members, ${POOL_COUNT} pools)`
  );

  const intervalMs = 1000 / ratePerSec;
  let sent = 0;
  const start = Date.now();
  const endTime = start + seconds * 1000;

  const metricsInterval = setInterval(() => {
    const m = computeMetrics();
    const triggers = evaluateTriggers(m);
    if (triggers.length > 0) {
      console.error(
        `[Lindiwe] Triggers: ${triggers.join(", ")} | ` +
        `buffer=${(m.bufferRatio * 100).toFixed(1)}% ` +
        `stability=${(m.stability * 100).toFixed(1)}% ` +
        `drain=R${m.totalDrain.toFixed(0)}`
      );
    }
  }, 2000);

  return new Promise((resolve) => {
    const eventInterval = setInterval(() => {
      if (Date.now() >= endTime) {
        clearInterval(eventInterval);
        clearInterval(metricsInterval);
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.error(`[EventFlow] Done: ${sent} events in ${elapsed}s`);
        resolve();
        return;
      }

      const event = makeEvent();
      // NDJSON to stdout — can be piped or captured
      console.log(JSON.stringify(event));
      sent++;
    }, intervalMs);
  });
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const rate = Number(process.argv[2]) || 15;
const sec = Number(process.argv[3]) || 60;

run(rate, sec).catch((err) => {
  console.error("[EventFlow] Fatal:", err);
  process.exit(1);
});
