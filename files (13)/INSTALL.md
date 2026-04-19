# SPINE INSTALL — Ubuntu Pools (monolithic repo)

## What changed from the previous version

All files have been corrected for the actual repo structure:

| Wrong (previous) | Correct (this version) |
|---|---|
| `packages/ledger/src/invariants.ts` | `src/lib/ledger/invariants.ts` |
| `packages/villages/src/spine.ts` | `src/lib/services/village-spine.ts` |
| `packages/db/src/schema-spine.ts` | `src/db/schema-spine.ts` |
| `packages/db/migrations/0007...sql` | `drizzle/migrations/0007_spine_invariants.sql` |
| `packages/villages/src/spine.test.ts` | `src/tests/village-spine.integration.test.ts` |
| `packages/ledger/src/invariants.test.ts` | `src/tests/ledger-invariants.test.ts` |
| `apps/web/app/api/health/spine/route.ts` | `src/app/api/health/spine/route.ts` |
| `@ubuntu/ledger/invariants` imports | `@/lib/ledger/invariants` imports |
| `@ubuntu/db/client` imports | `@/db/client` imports |

## Copy files into your repo

```bash
# From the spine output directory, copy each file:

cp src/lib/ledger/invariants.ts         /path/to/your-repo/src/lib/ledger/invariants.ts
cp src/lib/services/village-spine.ts    /path/to/your-repo/src/lib/services/village-spine.ts
cp src/db/schema-spine.ts               /path/to/your-repo/src/db/schema-spine.ts
cp drizzle/migrations/0007_spine_invariants.sql  /path/to/your-repo/drizzle/migrations/0007_spine_invariants.sql
cp src/tests/ledger-invariants.test.ts  /path/to/your-repo/src/tests/ledger-invariants.test.ts
cp src/tests/village-spine.integration.test.ts  /path/to/your-repo/src/tests/village-spine.integration.test.ts
cp src/app/api/health/spine/route.ts    /path/to/your-repo/src/app/api/health/spine/route.ts
cp scripts/run-spine.sh                 /path/to/your-repo/scripts/run-spine.sh
cp .github/workflows/spine.yml         /path/to/your-repo/.github/workflows/spine.yml
chmod +x /path/to/your-repo/scripts/run-spine.sh
```

## Update drizzle.config.ts

Add schema-spine.ts to the schema array:

```ts
// drizzle.config.ts
export default defineConfig({
  schema: [
    "./src/db/schema.ts",
    "./src/db/schema-credit.ts",
    "./src/db/schema-village.ts",
    "./src/db/schema-spine.ts",   // ← add this line
  ],
  // ...rest of your config
});
```

## Apply the migration

```bash
# Option A: direct psql
psql $DATABASE_URL < drizzle/migrations/0007_spine_invariants.sql

# Option B: via Drizzle (after updating drizzle.config.ts)
bun db:generate
bun db:migrate
```

## Verify the constraint was applied

```bash
psql $DATABASE_URL -c \
  "SELECT conname, contype FROM pg_constraint WHERE conname = 'balanced_posting'"
# Expected output:
#      conname      | contype
# ------------------+---------
#  balanced_posting | c
```

## Run the tests

```bash
# Unit tests (no DB, runs immediately)
bun test src/tests/ledger-invariants.test.ts

# Integration tests (requires DATABASE_URL)
DATABASE_URL=postgresql://localhost:5432/ubuntu_test \
bun test src/tests/village-spine.integration.test.ts \
  --include "**/*.integration.test.ts"

# Full runner
./scripts/run-spine.sh

# With DB
DATABASE_URL=postgresql://localhost:5432/ubuntu_test ./scripts/run-spine.sh
```

## Check the health endpoint

```bash
# Start dev server first
bun dev

# Then in another terminal
curl http://localhost:3000/api/health/spine | jq

# Healthy response:
# {
#   "status": "healthy",
#   "spine": {
#     "database": { "status": "ok" },
#     "ledger":   { "status": "ok", "totalEntries": 0 },
#     "events":   { "status": "ok", "totalEvents": 0 },
#     "projections": { "status": "ok", "maxLagSeconds": 0, "unprocessedCount": 0 },
#     "audit":    { "status": "ok", "eventsWithoutAuditTrace": 0 }
#   }
# }
#
# Note: "ok" with 0 counts is correct when no contributions have been made yet.
# The tables exist and the spine is wired — that's what matters.
```

## One file you may need to create

The spine imports `@/db/schema-village` for `villageMembers`.
Check if this exists in your repo:

```bash
ls src/db/schema-village.ts
```

If it doesn't exist, the `villageMembers` table is likely in `src/db/schema.ts`.
In that case, change this import in `village-spine.ts`:

```ts
// Change:
import { villageMembers } from "@/db/schema-village";
// To:
import { villageMembers } from "@/db/schema";
```

## The 5 enforced invariants (summary)

```
1. IDEMPOTENCY_KEY_MISSING      — no financial write without a key
2. POSTING_UNBALANCED           — debits must equal credits (+ DB CHECK constraint)
3. DIRECT_BALANCE_WRITE_FORBIDDEN — pool balance is projection-only
4. REPUTATION_DIRECT_WRITE_FORBIDDEN — Ubuntu Score via projection pipeline only
5. EVENT_NOT_PERSISTED          — notifications need a persisted event source
```

All five throw `LedgerInvariantViolation` with a `code` and `context` field.
Catch them by code in your error handlers for clean monitoring.
