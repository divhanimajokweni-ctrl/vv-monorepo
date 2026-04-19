# Development Rules

## Critical Rules

- **Package manager**: Use `bun` (not npm/yarn)
- **Never run** `next dev` or `bun dev` - the sandbox handles this automatically
- **Always commit and push** after completing changes:
  ```bash
  bun typecheck && bun lint && git add -A && git commit -m "descriptive message" && git push
  ```
- **Spine is sacred**: Never modify files in the spine path without running `bun test src/tests/ledger-invariants.test.ts`. Spine files: `src/lib/ledger/invariants.ts`, `src/lib/services/village-spine.ts`, `src/db/schema-spine.ts`

## Agent Configurations

Automated agents are configured in `.claude/agents/`:

| Agent | File | Schedule |
|-------|------|----------|
| Spine Health Monitor | `spine-health-monitor.yml` | 08:00 & 20:00 daily |
| Daily Reconciliation | `daily-reconciliation.yml` | 06:00 daily |
| Weekly Spine Test | `weekly-spine-test.yml` | Monday 09:00 |
| Monthly POPIA Audit | `monthly-popia-audit.yml` | 1st of month 09:00 |
| Projection Lag Repair | `projection-lag-repair.yml` | webhook trigger |
| Dependency Scanner | `dependency-scanner.yml` | Sunday 10:00 |
| Onboarding Validator | `onboarding-validator.yml` | on-demand |

## Commands

| Command | Purpose |
|---------|---------|
| `bun install` | Install dependencies |
| `bun build` | Build production app |
| `bun lint` | Check code quality |
| `bun typecheck` | Type checking |

## Best Practices

### React/Next.js
- Use Server Components by default; add `"use client"` only when needed
- Use `next/image` for optimized images
- Use `next/link` for client-side navigation
- Use `error.tsx` for error boundaries
- Use `not-found.tsx` for 404 pages

### API Routes
- Return `NextResponse.json({ error: "..." }, { status: 500 })` on failure
- Always include appropriate status codes
- Handle errors gracefully

### Code Quality
- Run `bun typecheck` before committing
- Run `bun lint` before committing
- Write descriptive commit messages
