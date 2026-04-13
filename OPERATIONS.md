# Ubuntu Pools — Operations & Deployment Guide

> This guide covers deployment, scaling, and operations for the Ubuntu Pools platform. For feature documentation, see [README.md](./README.md).

---

## Feature Status Legend

| Status | Icon | Description |
|--------|------|-------------|
| **Implemented** | 🟢 | Fully functional, tested, and integrated |
| **In Progress** | 🟡 | Partially implemented, active development |
| **Planned** | 🔵 | Documented but not yet implemented |

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Cloud Development Environments](#cloud-development-environments)
4. [Testing](#testing)
5. [Type Checking & Linting](#type-checking--linting)
6. [Database Setup](#database-setup)
7. [Database Operations](#database-operations)
8. [Production Build](#production-build)
9. [Deployment](#deployment)
10. [CI/CD Pipeline](#ci-cd-pipeline)
11. [Scaling Considerations](#scaling-considerations)
12. [Observability & Monitoring](#observability--monitoring)
13. [Security Operations](#security-operations)
14. [Rate Limiting](#rate-limiting)
15. [Disaster Recovery](#disaster-recovery)
16. [Troubleshooting](#troubleshooting)
17. [Future Vision](#future-vision)

---

## Prerequisites

- **Node.js** 18+ 
- **Bun** (recommended) or npm/yarn
- **PostgreSQL** database (for production features)

---

## Local Development 🟢

### 1. Install Dependencies

```bash
# Using Bun (recommended)
bun install

# Or using npm
npm install
```

### 2. Configure Environment

Create a `.env.local` file in the root directory:

```env
# Database (required for production features)
DATABASE_URL=postgresql://user:password@localhost:5432/ubuntu_pools

# Optional: For production, add your deployment URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server

```bash
bun dev
```

The app will be available at `http://localhost:3000`

---

## Cloud Development Environments

### Option 1: GitHub Codespaces (Recommended)

1. Go to your repository on GitHub
2. Click the green **Code** button
3. Select the **Codespaces** tab
4. Click **Create codespace on main**
5. Wait for the container to build (~2-3 minutes)
6. In the terminal, run:

```bash
bun run dev
```

7. Click the **Ports** tab in the bottom panel
8. Click the localhost:3000 link to preview

### Option 2: VS Code for the Web (No Setup)

1. Go to [vscode.dev](https://vscode.dev)
2. Click **"Open Remote"** (bottom-left corner)
3. Select **"Open GitHub Repository"**
4. Paste your repo URL
5. In the terminal:

```bash
bun install
bun run dev
```

6. Click **Ports** → **localhost:3000** → **Open in Browser**

### Option 3: Gitpod

1. Open:
```
https://gitpod.io/#https://github.com/divhanimajokweni-ctrl/generating-code-for-the-ubuntu-pools-platform-you
```

2. Sign in with GitHub
3. In terminal:

```bash
bun install
bun run dev
```

4. Click **Open Browser** on port 3000

---

## Testing

```bash
# Run all tests
bun test

# Watch mode
bun test:watch

# With coverage
bun test:coverage
```

---

## Type Checking & Linting

```bash
# Type check
bun typecheck

# Lint
bun lint
```

---

## Database (Optional - for full functionality)

```bash
# Generate Drizzle client
bun db:generate

# Run migrations
bun db:migrate

# Open Drizzle Studio
bun db:studio

# Seed development data
bun db:seed
```

---

## Database Operations 🟢

### Connection Pooling with PgBouncer

PostgreSQL can fail under high concurrency. Use PgBouncer as a connection pooling layer:

```
Next.js → PgBouncer → PostgreSQL
```

Configuration for `pgbouncer.ini`:

```ini
[databases]
ubuntu_pools = host=postgres.internal port=5432 dbname=ubuntu_pools

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 5
```

### Backup Strategy

| Type | Frequency | Retention |
|------|-----------|-----------|
| Full Backup | Daily | 30 days |
| Incremental | Every 4 hours | 7 days |
| Snapshot | Every 5 minutes | 24 hours |

#### Backup Commands

```bash
# Full backup with pg_dump
pg_dump -Fc -f backup.dump ubuntu_pools

# Restore from backup
pg_restore -d ubuntu_pools backup.dump

# Point-in-time recovery requires WAL archiving
```

### Ledger Sharding by Village

For large-scale deployments, shard ledgers by village:

```sql
-- Create village-specific schemas
CREATE SCHEMA village_soweto;
CREATE SCHEMA village_khayelitsha;

-- Each village has its own ledger tables in their schema
-- Federation settlement layer reconciles between schemas
```

---

## Production Build

```bash
bun build
```

This creates an optimized production build in the `.next` directory.

### Alternative Build Strategies for Cross-Platform Consistency

When working across multiple development environments (local, Codespaces, Gitpod, VS Code for Web), ensuring consistent builds requires additional strategies:

#### 1. Build Tool Alternatives

| Tool | Use Case | Command |
|------|----------|---------|
| **Bun** (default) | Fastest builds, all-in-one runtime | `bun build` |
| **Turbopack** | Next.js native, incremental builds | `npx next build --turbo` |
| **Webpack** (default Next.js) | Maximum compatibility | `npx next build` |

#### 2. Reproducible Builds

For consistent builds across all platforms, use these approaches:

```bash
# Lock dependencies to exact versions
bun install --frozen-lockfile

# Use a specific Bun version via .bun-version file
echo "1.x.x" > .bun-version

# Cache build artifacts between runs
bun build --cache
```

#### 3. Build Caching Strategies

**Local & Cloud Environments:**
```bash
# Enable build cache
NEXT_TELEMETRY_DISABLED=1

# Use CI cache for GitHub Actions
# Add to workflow: actions/cache with bun cache path
```

**GitHub Codespaces / Gitpod:**
```json
// .devcontainer.json for Codespaces
{
  "build": {
    "cacheFrom": "ubuntu-pools:latest"
  }
}
```

#### 4. CI/CD Pipeline Recommendations

For consistent production builds across all platforms:

```yaml
# .github/workflows/build.yml
name: Production Build
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun build
      - run: bun lint
      - run: bun typecheck
```

#### 5. Platform-Specific Build Optimizations

| Platform | Optimization | Configuration |
|----------|--------------|---------------|
| **Vercel** | Edge functions, ISR | Use `export const dynamic = 'force-static'` |
| **Railway** | Multi-stage Dockerfile | Enable build caching |
| **Render** | Pre-build script | `prerender.sh` for generation |
| **Docker** | Multi-stage builds | Use Alpine base, layer caching |

#### 6. Multi-Workspace Build Validation

To ensure builds work across all development environments:

```bash
# Test build in isolated environment
docker run --rm -it node:18-alpine sh
# Then run: npm install -g bun && bun build

# Validate with different Node versions
nvm install 18 && nvm use 18 && bun build
nvm install 20 && nvm use 20 && bun build
```

#### 7. Recommended Build Configuration

For production across all platforms, add to `next.config.js`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['@/components', '@/lib'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig
```

---

## Deployment

### Recommended Platform: Vercel

Vercel is the best platform for Next.js applications with zero configuration.

#### Option 1: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Option 2: Deploy via GitHub

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Click "Add New Project" and import your repository
4. Vercel will automatically detect Next.js and configure the build
5. Add environment variables in the Vercel dashboard if needed
6. Click "Deploy"

#### Environment Variables on Vercel

Add these in your project settings:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |

### Alternative Platforms

#### Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and init
railway login
railway init

# Add PostgreSQL
railway add postgresql

# Deploy
railway up
```

#### Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set build command: `bun install && bun build`
4. Set start command: `bun start`
5. Add `DATABASE_URL` environment variable

#### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package.json bun.lockb ./
RUN npm install -g bun && bun install --frozen-lockfile
COPY . .
RUN bun build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t ubuntu-pools .
docker run -p 3000:3000 ubuntu-pools
```

---

## CI/CD Pipeline 🟢

The project includes a GitHub Actions workflow (`.github/workflows/ci-cd.yml`) that provides:

### Pipeline Stages

| Stage | Jobs | Description |
|-------|------|-------------|
| **Lint & Type Check** | `lint-and-typecheck` | ESLint + TypeScript validation |
| **Tests** | `test` | Unit tests with coverage |
| **Build** | `build` | Production build with artifacts |
| **Security Scan** | `security-scan` | Dependency audit + CodeQL |
| **Deploy Staging** | `deploy-staging` | Auto-deploy on `develop` branch |
| **Deploy Production** | `deploy-production` | Manual approval + deploy on `main` |

### Environments

- **Staging**: Auto-deploys on push to `develop` branch
- **Production**: Deploys on push to `main` branch

### Required Secrets

Configure these in GitHub repository settings:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `STAGING_DATABASE_URL` | Staging PostgreSQL connection |
| `PRODUCTION_DATABASE_URL` | Production PostgreSQL connection |

---

## Scaling Considerations

### Horizontal Scaling

The Ubuntu Pools platform is designed for horizontal scaling:

| Component | Scaling Strategy |
|-----------|-------------------|
| **Next.js App** | Deploy multiple instances behind a load balancer (Vercel handles this automatically) |
| **PostgreSQL** | Use read replicas for query-heavy workloads; connection pooling (PgBouncer) for high concurrency |
| **WebSocket** | Use Socket.io with Redis adapter for multi-instance deployments |
| **Redis** | For session storage, caching, and real-time pub/sub |

### Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CDN                                │
│                    (CloudFlare/Vercel)                     │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   WAF (Web Application Firewall)            │
│              (Rate limiting, DDoS protection)               │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              Load Balancer (ALB/CloudFlare)                │
└─────────────────────────────────────────────────────────────┘
                               │
               ┌───────────────┼───────────────┐
               ▼               ▼               ▼
         ┌──────────┐    ┌──────────┐    ┌──────────┐
         │ Next.js  │    │ Next.js  │    │ Next.js  │
         │ Cluster  │    │ Cluster  │    │ Cluster  │
         └──────────┘    └──────────┘    └──────────┘
               │               │               │
               └───────────────┼───────────────┘
                               │
               ┌───────────────┼───────────────┐
               ▼               ▼               ▼
         ┌──────────┐    ┌──────────┐    ┌──────────┐
         │ PgBouncer│    │  Redis    │    │    S3    │
         │  (Pool)  │    │  Cluster  │    │ (Media)  │
         └──────────┘    └──────────┘    └──────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Cluster                         │
│  ┌─────────────────┐         ┌─────────────────┐            │
│  │    Primary     │◄──────►│  Read Replica   │            │
│  │   (Write)      │         │     (Read)      │            │
│  └─────────────────┘         └─────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### Enterprise Architecture (Multi-Region)

For global scaling:

```
                    ┌─────────────────┐
                    │   Global CDN    │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
  │  Africa     │      │   Asia      │      │  Europe     │
  │  Region     │◄────►│   Region    │◄────►│   Region    │
  └─────────────┘      └─────────────┘      └─────────────┘
         │                                       │
         ▼                                       ▼
  ┌─────────────┐                        ┌─────────────┐
  │  Village    │                        │  Village    │
  │  Ledger A   │                        │  Ledger B   │
  └─────────────┘                        └─────────────┘
```

### Performance Optimization

1. **Edge Caching** — Static assets served from edge (automatic with Vercel)
2. **Image Optimization** — Use `next/image` for automatic optimization
3. **Bundle Analysis** — Run `bun build && bun analyze` to identify large bundles
4. **Database Indexing** — Ensure indexes on frequently queried columns (member IDs, timestamps)
5. **Query Optimization** — Use Drizzle's query optimization; avoid N+1 queries

### Capacity Recommendations

| Scale | Members | Monthly Transactions | Recommended Stack |
|-------|---------|---------------------|-------------------|
| Village | 1-500 | <10,000 | Single PostgreSQL, no Redis |
| District | 500-10,000 | 10,000-100,000 | PostgreSQL + Redis |
| Region | 10,000-100,000 | 100,000-1,000,000 | PostgreSQL cluster + Redis cluster |
| Global | 100,000+ | 1,000,000+ | Multi-region PostgreSQL + Redis |

### Security Scaling

- **Rate Limiting** — Implement at load balancer level
- **DDoS Protection** — CloudFlare or Vercel built-in
- **API Throttling** — Per-member rate limits in application layer
- **WebSocket Security** — Authenticate connections; implement heartbeat

---

## Observability & Monitoring 🟡

### Recommended Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| **Metrics** | Prometheus | Time-series metrics collection |
| **Dashboards** | Grafana | Visualization and alerting |
| **Logs** | Loki or ELK | Log aggregation |
| **Tracing** | OpenTelemetry | Distributed tracing |

### Key Metrics to Monitor

| Metric | Description | Alert Threshold |
|--------|-------------|------------------|
| `transaction_latency` | Time to commit ledger transaction | > 500ms |
| `ledger_commit_time` | Time to finalize a ledger entry | > 1s |
| `governance_vote_latency` | Time to process a vote | > 2s |
| `websocket_connections` | Active WebSocket connections | > 10k |
| `db_query_time` | Database query execution time | > 200ms |
| `error_rate` | Percentage of failed requests | > 1% |
| `game_session_duration` | Time spent in game sessions | > 30min |
| `telemetry_signal_count` | Behavioural signals extracted per session | < 1 avg |
| `sovereignty_erasure_rate` | Game history erasure requests | Monitor trends |

### Dashboard Panels

```
- Transaction throughput (TPS)
- Error rate by endpoint
- Database connection pool usage
- WebSocket connection count
- API response times (p95, p99)
- Trust graph computation time
- Game session completion rate
- Behavioural signal extraction success rate
- Sovereignty erasure request volume
```

### WebSocket Heartbeat

```typescript
// Client: ping every 25 seconds
setInterval(() => {
  socket.emit('ping');
}, 25000);

// Server: disconnect if no response
socket.on('pong', () => {
  socket.lastPong = Date.now();
});

// Server: check for stale connections
setInterval(() => {
  const stale = Date.now() - socket.lastPong > 60000;
  if (stale) socket.disconnect();
}, 30000);
```

---

## Security Operations 🟢

### Key Management

| Key Type | Storage | Rotation |
|----------|---------|----------|
| User keys | Device secure enclave | On request |
| Server keys | Hardware Security Module (HSM) | 90 days |
| API keys | Secret manager (Vercel/AWS Secrets) | 30 days |
| JWT secrets | Secret manager | 60 days |

### Secret Rotation

Rotate these secrets periodically:

```bash
# Rotate DATABASE_URL
# 1. Generate new password
# 2. Update database user
# 3. Deploy new secret
# 4. Verify connectivity
# 5. Disable old credential

# Rotate API_KEYS
# Use Vercel CLI or dashboard
vercel secrets add api_key_$(date +%Y%m%d) "new-secret-value"
```

### Audit Logging

Every critical event is logged immutably:

| Event Type | Severity | Logged Fields |
|------------|----------|---------------|
| Proposal created | Low | actor, target, timestamp |
| Vote cast | Low | actor, target, timestamp |
| Credit issued | High | actor, target, amount, timestamp |
| Credit repaid | High | actor, target, amount, timestamp |
| Pool withdrawal | Critical | actor, target, amount, timestamp |
| Admin override | Critical | actor, target, reason, timestamp |

---

## Rate Limiting 🟢

### Application Limits

| Action | Limit | Window |
|--------|-------|--------|
| Login attempts | 10 | 1 minute |
| Transactions | 20 | 1 minute |
| Proposal creation | 5 | 1 day |
| Votes | 100 | 1 hour |
| API requests | 100 | 1 minute |
| WebSocket connections | 50 | 1 minute |

### Implementation

The rate limiter uses Upstash Redis:

```typescript
import { rateLimits } from '@/lib/access/rate-limit';

// Apply to API route
export async function POST(request: Request) {
  const identifier = getUserId(request);
  const { success } = await rateLimits.transactions.limit(identifier);
  
  if (!success) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }
  
  // Process request...
}
```

---

## Disaster Recovery 🟡

### Recovery Targets

| Metric | Target |
|--------|--------|
| RPO (Recovery Point Objective) | < 5 minutes |
| RTO (Recovery Time Objective) | < 30 minutes |

### Protection Methods

- Cross-region database replication
- Automatic failover with health checks
- Hourly backups stored in S3/Blob storage
- Multi-region Redis for session persistence

### Failover Procedure

1. **Detect** — Health check fails for > 30 seconds
2. **Alert** — PagerDuty/Slack notification
3. **Promote** — Promote read replica to primary
4. **Update** — Update DNS/load balancer to new primary
5. **Verify** — Run smoke tests
6. **Communicate** — Update status page

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Command not found: bun" | Run `curl -fsSL https://bun.sh/install \| bash` |
| Port 3000 in use | `lsof -i :3000` then kill process, or use `bun run dev --port 3001` |
| Dependencies missing | Run `bun install` |
| TypeScript errors | Run `bun run typecheck` to see errors |
| Database connection failed | Verify `DATABASE_URL` in `.env.local` |
| WebSocket connection failed | Ensure port 3001 (or configured port) is accessible |

---

## Future Vision

### Phase 4: Cross-Village Federation 🟡

Enable villages to form federations, sharing surplus credit capacity and diversifying risk across geographic boundaries.

**Required Infrastructure:**

| Component | Description |
|-----------|-------------|
| **Inter-Village Governance Protocols** | Federated voting, cross-village proposal ratification, dispute resolution |
| **Settlement Layer** | Atomic swaps between village currencies, real-time gross settlement (RTGS) between pools |
| **Reputation Portability** | Ubuntu Score export/import between villages; federation-wide identity namespace |

**Technical Requirements:**
- Federation-level ledger for inter-village transactions
- Byzantine fault-tolerant consensus for settlement disputes
- Zero-knowledge proofs for cross-village credit verification

**Recommendations:**
- Start with 2-3 pilot villages in same jurisdiction
- Implement tiered federation (village → district → region → global)
- Use hash time-locked contracts (HTLCs) for trustless settlement

**Settlement Layer Phased Approach:**

| Phase | Model | Complexity |
|-------|-------|------------|
| 1 | Village Ledger A ↔ Village Ledger B ↔ Clearing House | Low |
| 2 | Bilateral Settlement (direct village-to-village) | Medium |
| 3 | Cryptographic Settlement (HTLCs, atomic swaps) | High |

---

### Phase 5: Tokenized Commons 🔵

Convert commons assets (land, equipment, livestock) into fractional ownership tokens.

**Asset Classes:**

| Asset Type | Tokenization Strategy |
|------------|----------------------|
| **Land** | ERC-1155 tokens representing hectares/fractions; governance voting rights |
| **Equipment** | Usage tokens; maintenance cost sharing |
| **Livestock** | Individual animal tokens; yield/produce sharing |
| **Intellectual Property** | License tokens; royalty distribution |

**Governance Integration:**
- Members earn governance rights proportional to contribution (token holdings + activity)
- Circular incentive: More contribution → More tokens → More governance power → More influence over commons allocation

**Legal Considerations:**

Tokenizing assets can trigger regulatory requirements depending on jurisdiction:

| Asset Type | Potential Regulation |
|------------|---------------------|
| Land | Securities law, property law |
| Livestock | Commodities regulation |
| Equipment | Securities law (if investment) |
| Fractional ownership | Securities law (Howey test) |

**Phased Approach:**

| Phase | Token Type | Complexity | Legal Risk |
|-------|------------|------------|------------|
| 1 | Usage tokens (non-investment) | Low | Low |
| 2 | Revenue sharing tokens | Medium | Medium |
| 3 | Fractional ownership | High | High |

**Recommendations:**
- Start with non-controversial assets (community tools, meeting halls)
- Implement gradual tokenization (test with 10% of assets first)
- Legal structure: Cooperative or Benefit Corporation to hold assets
- Consult local legal counsel before fractional ownership

---

### Phase 6: Autonomous Economic Zones 🔵

Partner with regulators to create special economic zones where Ubuntu Pools governance rules apply directly.

**Partnership Model:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Regulatory Framework                      │
│         (Central Bank / Financial Services Authority)       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Ubuntu Pools SEZ License                     │
│    (Legal entity with custom regulatory treatment)          │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │  Collective │    │  Collective │    │  Collective │
   │   Enterprise │    │   Enterprise │    │   Enterprise │
   │    #1       │    │    #2       │    │    #3       │
   └─────────────┘    └─────────────┘    └─────────────┘
```

**Benefits:**
- Legal recognition of collective ownership
- Preferential tax treatment for pooled resources
- Regulatory sandbox for innovative financial products
- Streamlined compliance for cross-border settlements

**Recommendations:**
- Begin with jurisdictions known for fintech innovation (Kenya, Singapore, UAE, Estonia)
- Engage legal counsel for entity structure (LLC, cooperative, foundation)
- Build relationships with central bank innovation hubs

---

### Phase 7: Global Ubuntu Network 🔵

Connect Ubuntu Pools instances across continents, creating a global network of interconnected villages.

**Network Topology:**

```
                        ┌─────────────────┐
                        │  Global Ubuntu   │
                        │    Registry      │
                        │  (Name spacing,  │
                        │   Root of Trust) │
                        └────────┬────────┘
                                 │
      ┌──────────────────────────┼──────────────────────────┐
      │                          │                          │
      ▼                          ▼                          ▼
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│   African    │◄────────►│   Asian     │◄────────►│   European  │
│   Federation│          │   Federation│          │   Federation│
└─────────────┘          └─────────────┘          └─────────────┘
      │                          │                          │
      ▼                          ▼                          ▼
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│  Village    │          │  Village    │          │  Village    │
│  Cluster    │          │  Cluster    │          │  Cluster    │
└─────────────┘          └─────────────┘          └─────────────┘
```

**Key Capabilities:**
- **Federated Identity** — Cross-instance member verification
- **Trust Routing** — Trust graph spans instances
- **Currency Bridge** — Convert between village/federation currencies
- **Global Reputation** — Aggregate Ubuntu Score across network

**Trust Graph Evolution:**
- Phase 1-3: Trust graph = relationships between individuals
- Phase 4-7: Trust graph = relationships between individuals AND villages AND federations
- Meta-reputation: Villages earn collective trust scores based on member outcomes

**Recommendations:**
- Establish inter-federation governance before technical integration
- Pilot with diaspora communities (remittance corridors)
- Implement gradual trust (high-value transactions require established relationships)

---

## Long-Term Architectural Considerations

### Decentralization Roadmap

| Phase | Centralization Level | Trust Model |
|-------|---------------------|-------------|
| 1-3 | Centralized server | Single instance, single operator |
| 4 | Federated | Multiple instances, consortium operators |
| 5 | Distributed | Multiple operators, smart contract governance |
| 6-7 | Decentralized | Community-run nodes, open protocol |

### Governance Evolution

As the network scales, governance must evolve:

1. **Village Level** (current) — Direct democracy, all members vote
2. **Federation Level** — Delegate democracy, elected representatives
3. **Global Level** — Liquid democracy, dynamic delegation based on expertise

### Economic Model Sustainability

Long-term sustainability requires diversified revenue streams:

| Revenue Source | Rate | Description |
|----------------|------|-------------|
| **Transaction Fee** | 0.25% | On every credit transfer |
| **Credit Origination Fee** | 0.5% | When credit is issued |
| **Village Subscription** | R50-200/month | Core platform services |
| **Institutional Analytics** | Custom | Data insights for partners |
| **Cross-Border Settlement** | 0.1% | Federation transactions |
| **Tokenized Asset Fees** | 1% | Asset tokenization service |

**Revenue Allocation:**
- 50% — Infrastructure & operations
- 25% — Security & compliance
- 15% — Development & feature work
- 10% — Governance operations

---

## Hierarchical Trust Graph (HTG) 🟡

The platform implements a Hierarchical Trust Graph to enable scaling to millions of users:

### Layer Structure

```
Global Network
     │
     ▼
Federation (Regional: Africa, Europe, Asia)
     │
     ▼
Village (Community Pool)
     │
     ▼
Individual (Member)
```

### Trust Propagation

Trust flows upward through aggregation:

```
Individual Score → Village Score → Federation Score → Global Score
```

### Village Trust Formula

```
VillageTrust = average(memberScores) × governanceParticipation × (1 - defaultRate)
```

### Benefits

1. **Scalability** — Each layer is independently computable
2. **Fraud Detection** — Suspicious clusters fail to propagate trust upward
3. **Credit Risk** — Individual creditworthiness enhanced by community reliability
4. **Governance** — Nested voting mirrors real democratic systems
5. **Ledger Sharding** — Each village can have its own ledger shard

### Implementation

```typescript
import { calculateVillageTrust, HierarchicalTrustGraph } from '@/lib/trust-graph/hierarchy';

const trustScore = calculateVillageTrust(
  memberScores,      // [72, 73, 74, ...]
  0.85,              // governance participation
  0.02               // default rate
);
```

---

## Additional Resources

- [README.md](./README.md) — Feature documentation and codebase overview
- [Tech Stack](./README.md#technical-decisions-explained) — Architecture decisions
- [API Endpoints](./README.md#api-endpoints) — REST API reference
- [Contributing](./README.md#contributing) — Contribution guidelines

---

## License

MIT
