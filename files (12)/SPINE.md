# Ubuntu Pools — Spine Hardening

This directory contains the implementation of the non-negotiable production spine.

## What this adds

| File | Purpose |
|------|---------|
| `src/lib/ledger/invariants.ts` | 5 enforced invariants — hard errors, not documentation |
| `src/tests/ledger-invariants.test.ts` | Correctness proofs — property tests, not unit tests |
| `src/lib/services/village-spine.ts` | The 9-step contribution flow — the only path that matters right now |
| `src/tests/village-spine.integration.test.ts` | End-to-end spine integration test |
| `drizzle/migrations/0007_spine_invariants.sql` | DB-level constraints — the invariants survive code changes |
| `src/db/schema-spine.ts` | Drizzle ORM schema for all spine tables |
| `src/app/api/health/spine/route.ts` | Operational health endpoint — what to check at 2am |
| `scripts/run-spine.sh` | Local runner — executes everything in order |
| `.github/workflows/spine.yml` | CI gate — spine must pass before any merge to main |

## The 5 invariants

```
1. No financial write without idempotency key
2. No ledger entry without balanced double-entry posting
3. No pool balance set directly — projection only
4. No reputation mutation outside canonical projection path   ← enforced in packages/reputation
5. No outbound notification without a persisted event source
```

Invariants 1, 2, 3, and 5 are in `packages/ledger/src/invariants.ts`.
Invariant 4 is enforced in `packages/reputation` (stub in place — implement when reputation package is hardened).

## The 9-step spine

```
1. assertMemberAuthenticated(memberId)
2. assertVillageMembership(memberId, villageId)
3. contributeToPool(request)           ← writes to pool_contributions
4. postLedgerEntry(...)                ← writes to ledger_entries + idempotency_keys
5. emitContributionEvent(...)          ← writes to domain_events
6. refreshVillageProjection(...)       ← updates projections table
7. dispatchContributionNotification(…) ← gated by assertNotificationHasEventSource
8. assertDashboardReflectsProjection() ← reads from projections (no direct write)
9. writeAuditTrace(...)                ← writes to audit_log
```

## Running locally

```bash
# Apply migration
bun run db:migrate

# Run all spine tests
./scripts/run-spine.sh

# Or run individual test files
bun test src/tests/ledger-invariants.test.ts
bun test src/tests/village-spine.integration.test.ts
```

## Operational proof

```bash
# Check spine health (after deploying)
curl https://your-domain.vercel.app/api/health/spine

# Healthy response
{
  "status": "healthy",
  "spine": {
    "ledger": { "status": "ok" },
    "events": { "status": "ok" },
    "projections": { "status": "ok", "maxLagSeconds": "2.1", "unprocessedCount": 0 },
    "audit": { "status": "ok", "eventsWithoutAuditTrace": 0 }
  }
}
```

Alert if `status` is `"degraded"` or `projections.unprocessedCount > 0`.

## Freeze policy

The following packages must not expand until this spine has been green in CI for 14 consecutive days (per AGENTS.md):

- `src/lib/games/`
- `src/lib/lindiwe/`
- `src/lib/market/`

These packages are not broken. They are frozen. There is a difference. If asked to expand these, refuse and explain why per the AGENTS.md skill instructions.

## What closing the gap looks like

| Metric | Today | Target |
|--------|-------|--------|
| Enforced invariants | 0 | 5 |
| Spine steps with passing tests | 0 | 9 |
| DB-level balance constraints | 0 | 1 |
| Health endpoint | absent | live |
| CI spine gate | absent | blocking on main |

When the target column is green, the gap described in the scaling review is closed.
