# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**IMPORTANT**: Before any task, read `AGENTS.md` in the repo root for mandatory skills and execution rules.

## Build & Development Commands

```bash
bun dev                  # Start Next.js dev server
bun build                # Production build
bun lint                 # ESLint
bun typecheck            # TypeScript strict type checking
bun test                 # Run unit tests (Vitest, no DB required)
bun test:watch           # Vitest in watch mode
bun test:coverage        # Coverage report (V8, covers src/lib/**)
bun test src/tests/ledger-invariants.test.ts  # Run spine invariant tests
```

**Database (PostgreSQL + Drizzle ORM):**
```bash
bun run db:generate      # Generate Drizzle migrations
bun run db:migrate       # Apply migrations
bun run db:studio        # Open Drizzle Studio GUI
```

**Spine Check** (must pass before any deployment):
```bash
bun typecheck
bun test src/tests/ledger-invariants.test.ts
curl ${NEXT_PUBLIC_URL}/api/health/spine | jq .status
```

**CI pipeline** (`.github/workflows/audit.yml`): runs typecheck → lint → test → PII audit → hash chain verification → cosign signing.

## Architecture

**Ubuntu Pools** is a collective financial coordination platform built with Next.js 16 (App Router) + React 19 + TypeScript (strict) + PostgreSQL.

### Core Layers (in `src/lib/`)

- **Event Sourcing** (`eventsourcing/`) — All state changes are immutable, append-only events with a hash chain for tamper-evidence. Central to the entire system.
- **Ledger Engine** (`ledger/`) — Double-entry bookkeeping. Account types: asset, liability, equity, revenue, expense. Atomic postings via journal entries.
- **Backbone** (`backbone/`) — Central nervous system. Contains **Lindiwe AI** (autonomous financial governance agent), Ubuntu Backbone Controller, Village Pulse monitoring (anxiety/excitement/stability), safety buffer management, and member scoring.
- **Services** (`services/`) — Business logic layer: EventService, LedgerService, CreditService, ProposalService, Matchmaker, ServiceBus (in-process pub/sub).
- **Access Control** (`access/`) — RBAC with authority levels, consent manager, permission guards (self-access, privilege, ownership).
- **Integrations** (`integrations/`) — OpenClaw (Executive Shadow C2 for WhatsApp/Signal alerts), Stitch (South African open banking).
- **Bank Provider** (`bank-provider/`) — Provider abstraction with Stitch implementation for transactions and balances.
- **WebSocket** (`websocket/`) — Socket.io real-time updates for ledger, events, and reputation.
- **Privacy/Governance** (`privacy/`, `governance/`) — Sovereignty framework for data ownership, constitution-based governance gates.

### API Routes (in `src/app/api/`)

19 routes organized by domain: `events/`, `ledger/accounts/`, `credit/{pools,eligibility,loans,payments,health,score}`, `stitch/{create-link-token,exchange-token,transactions,connection}`, `observability/{health,metrics}`, `sovereignty/`, `matchmaker/`, `backbone/`.

### Database Schema (`src/db/`)

Key tables: `events` (immutable log with hash chain), `accounts` (chart of accounts), `journal_entries` (posted ledger entries), `credit_pools`. Database constraints prevent mutation after insert. Enums: `event_status`, `account_type`, `entry_side`.

### Key Patterns

- **Event sourcing + CQRS**: commands emit events, queries read projected state
- **Double-entry invariant**: every ledger posting must balance debits and credits
- **ServiceBus pub/sub**: loose coupling between modules
- **Zod validation**: all API inputs validated with Zod schemas
- **Path alias**: `@/*` maps to `./src/*`

### Automated Agents (`.claude/agents/`)

| Agent | Purpose | Schedule |
|-------|---------|----------|
| `spine-health-monitor.yml` | Check /api/health/spine, projection lag, audit completeness | 08:00 & 20:00 daily |
| `daily-reconciliation.yml` | Reconcile Dodo Payments webhooks against ledger entries | 06:00 daily |
| `weekly-spine-test.yml` | Run full spine test suite, block deployment on failure | Monday 09:00 |
| `monthly-popia-audit.yml` | Audit POPIA consent records, check erasure requests | 1st of month 09:00 |
| `projection-lag-repair.yml` | Auto-repair stale village projections | webhook trigger |
| `dependency-scanner.yml` | Scan for CVEs, block deployment on critical | Sunday 10:00 |
| `onboarding-validator.yml` | Validate 9-step spine before village goes live | on-demand |

## Testing

- Unit tests in `src/tests/*.test.ts` — pure logic, no DB required
- Integration tests in `src/tests/*.integration.test.ts` — require PostgreSQL, excluded from default run
- Vitest globals are **disabled** — import `describe`, `it`, `expect` from `vitest`
- 10s timeout per test

## Quickstart Directory

`quickstart/` contains multi-language API server examples (Node, Python, Go, Java, Ruby) with Docker Compose orchestration. This is **excluded from TypeScript compilation** and linting — it's a separate concern from the main app.

## Environment Variables

Required: `DATABASE_URL`. Optional: `STITCH_CLIENT_ID/SECRET`, `OPENCLAW_ENABLED/GATEWAY_URL/API_KEY`, `NEXT_PUBLIC_SOCKET_URL`, `NEXT_PUBLIC_METRICS_ENABLED`. See `.env.local.example`.
