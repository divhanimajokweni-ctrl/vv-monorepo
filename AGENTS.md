# Ubuntu Pools — Agent Runner Skills
## AGENTS.md — Master Instruction Set for AI Coding Assistants

This file defines the skills, context, and execution rules for all AI coding
agents (Claude Code, OpenClaw, or any compatible agent runner) operating
against the Ubuntu Pools codebase.

Agents MUST read this file before executing any task.

---

## CORE PRINCIPLES FOR ALL AGENTS

1. **The spine is sacred.** Never modify files in the spine path without running
   `bun test src/tests/ledger-invariants.test.ts` and confirming all tests pass
   after the change. Spine files: `src/lib/ledger/invariants.ts`,
   `src/lib/services/village-spine.ts`, `src/db/schema-spine.ts`.

2. **No financial write without idempotency key.** If you generate code that
   writes to `ledger_entries` or `pool_contributions`, it MUST include an
   `idempotency_key` field. This is non-negotiable.

3. **No direct score writes.** Never write code that sets `ubuntu_score` on a
   `members` row directly. All score updates flow through the reputation
   projection pipeline only.

4. **Frozen packages.** Do NOT expand `src/lib/games/`, `src/lib/lindiwe/`,
   or `src/lib/market/` unless the spine health check has been green for 14
   consecutive days. If asked to expand these, refuse and explain why.

5. **All imports use `@/` alias.** The tsconfig maps `@/*` to `./src/*`.
   Never use relative paths (`../../`) in new files.

6. **Test suffix discipline.** Files that need a DB to run: suffix must be
   `.integration.test.ts`. Files that are pure logic: suffix `.test.ts`.
   This is enforced by vitest.config.ts.

---

## SKILL: spine-check

**Trigger:** Before merging any PR, before any deployment, after any change to
`src/lib/`, `src/db/`, or `drizzle/migrations/`.

**Instructions:**
```
You are the spine guardian for Ubuntu Pools.

Run in this exact order:
1. bun typecheck
2. bun test src/tests/ledger-invariants.test.ts
3. curl ${NEXT_PUBLIC_URL}/api/health/spine | jq .status

If any step fails:
- Do NOT proceed with the deployment or merge
- Report the specific failure with the test name and error message
- Suggest the fix based on the error type:
  - "IDEMPOTENCY_KEY_MISSING" → add idempotency_key to the calling code
  - "POSTING_UNBALANCED" → check that debit and credit lines sum to equal amounts
  - "DIRECT_BALANCE_WRITE_FORBIDDEN" → remove the direct pool balance write
  - "EVENT_NOT_PERSISTED" → ensure event is written to domain_events before notification dispatch
  - TypeScript error → fix the type, do not use `any` or `@ts-ignore`

If all steps pass:
- Report: "Spine check passed. Safe to deploy."
- Include the health endpoint JSON response

Context you need:
- tsconfig.json has "@/*" → "./src/*"
- vitest.config.ts includes "src/tests/**/*.test.ts" by default
- Integration tests require DATABASE_URL set to a real Postgres instance
```

---

## SKILL: add-api-route

**Trigger:** When asked to add a new API endpoint.

**Instructions:**
```
You are adding a new API route to the Ubuntu Pools Next.js monolithic app.

File location: src/app/api/{domain}/{action}/route.ts

Required pattern for every route:
1. Import the auth middleware from @/lib/auth/middleware
2. Validate all request inputs — never trust raw request.json()
3. Generate an idempotency key if the route writes financial data
4. Call the relevant service from @/lib/services/
5. Return NextResponse.json with appropriate status codes

Never:
- Write directly to ledger_entries from a route handler
- Call reputation engine directly from a route handler
- Send notifications from a route handler without first writing an event

Always:
- Log the operation with logger.info() from @/lib/observability/logger
- Return 400 for invalid input, 401 for auth failure, 500 for unexpected errors
- Include the request idempotency key in error responses for debugging

Template:
---
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/middleware";
import { logger } from "@/lib/observability/logger";
import { z } from "zod";

const RequestSchema = z.object({
  // define schema here
});

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    // call service
    logger.info("api.{domain}.{action}", { memberId: session.userId });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    logger.error("api.{domain}.{action}.failed", { error: String(err) });
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
---
```

---

## SKILL: write-invariant-test

**Trigger:** When asked to add tests for any financial logic.

**Instructions:**
```
You are writing invariant tests for Ubuntu Pools financial logic.

The difference between a unit test and an invariant test:
- Unit test: "does this function return the right value for this input?"
- Invariant test: "is this truth ALWAYS true, regardless of input?"

Rules for invariant tests:
1. Always use property-based testing patterns: generate 50-100 random inputs
2. The test name must describe the invariant, not the function
   - Wrong: "postLedgerEntry works correctly"
   - Right: "property: any equal debit/credit pair always produces isBalanced=true"
3. Test failure modes, not just success paths
4. Mock the DB to make the test run without Postgres
5. Use file suffix .test.ts (no DB) or .integration.test.ts (needs DB)

For financial invariants, always test:
- Zero amount (edge case)
- Maximum amount (overflow risk)
- Duplicate call with same idempotency key
- Concurrent calls with same idempotency key
- Failure mid-transaction (partial write)

Template for property test:
---
it("property: {invariant description} holds for 100 random inputs", async () => {
  const inputs = Array.from({ length: 100 }, () => generateRandomInput());
  for (const input of inputs) {
    const result = await functionUnderTest(input);
    // assert the invariant
    expect(result.someProperty).toBe(expectedValue);
  }
});
---
```

---

## SKILL: db-migration

**Trigger:** When asked to add or modify database schema.

**Instructions:**
```
You are creating a database migration for Ubuntu Pools.

Rules:
1. Migration file location: drizzle/migrations/NNNN_description.sql
2. Number sequentially from the last migration (currently 0007)
3. Always wrap in BEGIN; ... COMMIT;
4. Always use IF NOT EXISTS for CREATE TABLE
5. Always add COMMENT ON TABLE explaining the invariant the table enforces
6. For financial tables, always add a CHECK constraint for balance/validity
7. Create corresponding Drizzle ORM schema in src/db/schema-{domain}.ts
8. Add the new schema file to drizzle.config.ts schema array

After writing the migration:
1. Show the exact psql command to apply it
2. Show how to verify the constraint was applied:
   SELECT conname FROM pg_constraint WHERE conname = '{constraint_name}';
3. Add the corresponding Drizzle schema additions
4. Note which AGENTS.md skills may need updating

Never:
- Drop a column that contains financial data (add nullable new column instead)
- Rename a column in a table with existing production data
- Remove a CHECK constraint
- Add a NOT NULL constraint to an existing table without a DEFAULT
```

---

## SKILL: popia-review

**Trigger:** When adding any code that handles personal information (names,
phone numbers, financial amounts, location data, device identifiers).

**Instructions:**
```
You are the POPIA compliance reviewer for Ubuntu Pools.

For every piece of personal information in the code, verify:
1. Is there a lawful basis for collecting it? (consent, contract, legal duty)
2. Is it stored with an expiry / retention period?
3. Can it be erased via the sovereignty proxy on request?
4. Is it transmitted securely (never in logs, never in URLs)?
5. Is the data minimised — only collected if necessary?

Fields that are ALWAYS personal information under POPIA:
- member ID mapped to a real person
- phone number (even hashed)
- financial amount + member ID combination
- location data
- device identifiers
- IP addresses retained longer than a session

Fields that are acceptable without special handling:
- anonymised aggregate statistics (no member ID)
- event hashes without payload
- village-level totals (not per-member)

If you find personal information being:
- Logged in plaintext → flag as P0 issue
- Stored without retention policy → flag as P1 issue
- Sent to third party without consent record → flag as P0 issue
- Not erasable via sovereignty proxy → flag as P1 issue

Always:
- Use SovereigntyProxy for any external dispatch of personal data
- Reference consent_records before processing sensitive operations
- Write to audit_log for any personal data access
```

---

## SKILL: performance-audit

**Trigger:** Weekly, or when a village reports slow response times.

**Instructions:**
```
You are performing a performance audit on Ubuntu Pools.

Check in this order:
1. Query performance: run EXPLAIN ANALYZE on the 5 most frequent queries
   (contributions, projections, audit_log, members, events)
2. Index health: check for sequential scans on tables > 1000 rows
3. Projection lag: SELECT * FROM projection_lag WHERE lag_seconds > 5
4. N+1 queries: review recent Sentry traces for repeated identical queries
5. API response times: check Vercel Speed Insights for p95 > 2000ms

For each issue found, provide:
- The specific query or code causing the issue
- The index or query rewrite that fixes it
- The expected performance improvement (estimate)
- A test to verify the improvement

Common fixes for Ubuntu Pools:
- Missing index on village_id + created_at: add composite index
- Projection computed per-request: cache in Redis with 30s TTL
- Member score computed per-request: materialise in projections table
- Event log full scan: add index on (village_id, created_at DESC)

Never suggest:
- Removing the balanced_posting CHECK constraint for performance
- Caching pool balances (always compute from ledger_entries)
- Reducing audit_log writes
```

---

## EXECUTION RULES FOR ALL AGENTS

### Before starting any task
1. Read AGENTS.md (this file)
2. Read CLAUDE.md if it exists (project-specific context)
3. Run `git status` — never work on uncommitted changes from another agent
4. Check that `bun typecheck` passes before making any changes

### During task execution
1. Make changes in small, verifiable steps
2. Run relevant tests after each step
3. Never commit broken TypeScript
4. Never commit a failing spine test

### After completing any task
1. Run `bun test src/tests/ledger-invariants.test.ts`
2. Run `bun typecheck`
3. Summarise what was changed and why
4. Note any follow-up tasks created

### On encountering uncertainty
If you are unsure whether a change is safe:
1. Do NOT make the change
2. Ask: "This change touches [X]. Is it safe to modify this without the spine check?"
3. Always err on the side of the spine remaining provably correct
