# Ubuntu Pools — Replit Project Notes

## What This Is
Ubuntu Pools is a community savings platform (stokvel/chama) built on Ubuntu philosophy ("I am because we are"). Members stake from R500, earn together, and self-govern via trust-based mechanisms.

## Tech Stack
- **Framework**: Next.js 15.5.15 (App Router)
- **Runtime**: Node.js 20
- **Auth**: Clerk v7 (keyless dev mode; needs real keys for production)
- **DB ORM**: Drizzle ORM + `postgres` driver
- **Styling**: Tailwind CSS v4
- **Observability**: Sentry (disabled unless `NEXT_PUBLIC_SENTRY_DSN` is set)
- **Analytics**: Vercel Analytics / Speed Insights (debug mode in dev)

## How It Runs
The dev server uses a **custom Node.js HTTP wrapper** (`server.js`) instead of `next dev` directly.

> **Why?** Next.js 15/16 in this Replit environment exits the parent process immediately after printing "Ready", orphaning the HTTP child process. The custom server (`node server.js`) keeps the process alive correctly.

```
npm run dev  →  node server.js  →  Next.js programmatic API on port 5000
```

## Key Files
| File | Purpose |
|------|---------|
| `server.js` | Custom HTTP server — keeps process alive in Replit |
| `next.config.ts` | Next.js config: allowed origins, security headers, rewrites |
| `src/middleware.ts` | Clerk authentication middleware |
| `src/instrumentation.ts` | Sentry init (guarded by env var) |
| `src/db/client.ts` | Drizzle DB client (lazy proxy — safe with missing DATABASE_URL) |
| `src/lib/events/hasher.ts` | Event hash chain verification (has CLI exit guards at bottom) |
| `helm/` | Helm chart for Kubernetes deployment |
| `scripts/bump-version.sh` | Version bumping script |

## Environment Variables Needed
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Production | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Production | Clerk publishable key |
| `CLERK_SECRET_KEY` | Production | Clerk secret key |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Enables Sentry error tracking |

## Infrastructure
- **Helm chart**: `helm/` — `Chart.yaml`, `values.yaml`, `templates/`
- **Dev overlay**: `overlays/helm/up/dev-values.yaml` — needs `<LB_IP>` replaced with cluster load balancer IP
- **Version bumping**: `scripts/bump-version.sh`
- **GitHub Actions**: Workflows for CI/CD (note: Node.js 20 actions deprecation warnings present)

## Known Issues / TODOs
1. `<LB_IP>` placeholder in `overlays/helm/up/dev-values.yaml` needs real cluster IP
2. Vercel deployment setup not yet addressed
3. `@opentelemetry/instrumentation` shows "critical dependency" webpack warnings (cosmetic, harmless)
4. Clerk is in keyless dev mode — provides a claim URL in logs on first start
