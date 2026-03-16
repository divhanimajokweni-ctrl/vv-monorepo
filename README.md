# Ubuntu Pools Platform

> *"I am because we are"* — A collective prosperity system with trust-based governance, immutable ledger, and community-driven impact.

---

## Vision Statement

Ubuntu Pools is a digital platform designed to operationalize the African philosophy of Ubuntu — collective interdependence — through technology. The platform enables communities to pool resources, build trust through transparent governance, and create sustainable prosperity circles that transcend traditional financial systems.

### Core Philosophy

The platform addresses three fundamental challenges in community-based finance:

1. **Trust Deficits** — Traditional systems require centralized authorities to establish trust. Ubuntu Pools replaces this with a cryptographically verifiable, peer-attested reputation system where trust is earned through demonstrated reciprocity and community contribution.

2. **Exclusion** — Billions remain unbanked or underbanked. The platform's zero-knowledge proofs and privacy-preserving architecture allow participation without revealing sensitive personal data.

3. **Vulnerability** — Individual families face catastrophic risk from single-point failures. The collective structure distributes risk across the village while maintaining individual sovereignty.

---

## Detailed Codebase Preview

### Architecture Overview

```
src/
├── app/                          # Next.js 16 App Router
│   ├── api/                      # REST API endpoints
│   │   ├── cpme/                # Collective Procurement & Market Engine
│   │   ├── credit/              # Credit facilities
│   │   ├── villages/            # Village OS
│   │   ├── backbone/            # Lindiwe AI
│   │   └── ...
│   ├── page.tsx                 # Main dashboard (Feed)
│   ├── messages/                # Direct messaging
│   ├── notifications/           # Notifications
│   ├── search/                  # Search
│   ├── profile/                 # User profile
│   ├── village/                 # Village page
│   └── globals.css              # Tailwind 4 theme
├── components/
│   ├── backbone/                # Lindiwe AI integration
│   ├── collective/              # Timebank & contribution systems
│   ├── credit/                  # Credit dashboard & pool health
│   ├── dashboard/               # Trust score & technical dashboards
│   ├── governance/              # Proposal & voting UI
│   ├── home/                    # FAQ, prosperity tiers, activity
│   ├── ledger/                  # Immutable transaction display
│   ├── lindiwe/                 # AI governance assistant
│   ├── privacy/                 # Sovereignty controls
│   ├── sovereignty/             # Data rights management
│   ├── stitch/                  # South African banking integration
│   ├── village/                 # Village circles, pools, commons
│   └── ui/                      # Shared UI components
├── lib/
│   ├── access/                  # RBAC & consent management
│   ├── api/                     # Route handlers & validation
│   ├── auth/                    # Authentication middleware
│   ├── backbone/                # Central nervous system (Lindiwe + Matchmaker)
│   ├── bank-provider/           # Banking abstraction layer
│   ├── cache/                   # Redis/in-memory caching
│   ├── custody/                 # Custody adapters
│   ├── events/                  # Event schemas & signing
│   ├── eventsourcing/           # Event sourcing core
│   ├── features/                # Feature flags
│   ├── governance/              # Constitution & proposals
│   ├── identity/                # Keypair management & proofs
│   ├── integrations/            # OpenClaw & Stitch
│   ├── ledger/                  # Merkle trees & snapshots
│   ├── market/                  # CPME core services
│   ├── observability/           # Sentry, logging, performance
│   ├── openclaw/               # Executive shadow gateway
│   ├── performance/             # Edge optimization
│   ├── privacy/                # Data sovereignty framework
│   ├── reputation/             # Trust score engine + friction mechanisms
│   ├── identity/               # Portable passport & credentials
│   ├── services/               # Business logic services
│   ├── sybil/                  # Sybil attack defense
│   ├── trust-graph/            # Graph-based fraud detection
│   └── websocket/              # Real-time communication
├── db/
│   ├── migrations/               # Drizzle migrations
│   ├── schema.ts                # Core database schema
│   ├── schema-credit.ts         # Credit facilities schema
│   ├── schema-village.ts        # Village OS schema
│   ├── schema-cpme.ts          # CPME schema
│   ├── schema-invite.ts        # Invite chain schema
│   └── client.ts                # DB client
└── tests/                        # Vitest test suite
```

---

## Feature Justifications

### 1. Trust-Based Reputation System (`src/lib/reputation/`)

**What it does**: Calculates a composite Ubuntu Score (0-100) from five weighted components:
- Reciprocity Index (25%) — ratio of help given vs. received
- Consistency Score (20%) — activity spread over 30-day windows
- Community Endorsements (20%) — peer attestations received
- Governance Participation (20%) — proposal and voting engagement
- Resource Sharing (15%) — value contributed to commons

**Why it matters**: The score replaces credit bureaus with community knowledge. A new member starts at 0 but can rapidly build trust through small contributions. The score gates access to credit facilities, governance rights, and village membership — all determined by demonstrated commitment, not static identity data.

**Authority Levels**: The system maps scores to five tiers (novice → archivist), each with escalating privileges from view-only to emergency constitutional powers.

### 2. Governance Constitution Engine (`src/lib/governance/`)

**What it does**: Machine-enforced governance rules via a versioned constitution. The `GovernanceRuleEngine` evaluates proposals against deterministic rules for:
- **Quorum** — minimum participation thresholds
- **Approval threshold** — percentage of yes votes required
- **Eligibility** — membership requirements for proposers
- **Timing** — minimum/maximum voting periods
- **Constraints** — supermajority for constitutional amendments

**Why it matters**: Human governance is slow, inconsistent, and susceptible to capture. This system makes governance outcomes predictable and auditable while preserving the collective decision-making spirit of Ubuntu.

**Key invariant**: All rules are enforced server-side. The UI cannot bypass them.

### 3. Immutable Ledger with Double-Entry Bookkeeping (`src/lib/ledger/`)

**What it does**: An append-only journal with cryptographic hash chains. Every transaction creates balanced debit/credit pairs. The Merkle tree enables proof-of-existence for any historical entry.

**Why it matters**: Community finance requires absolute transparency. The ledger ensures every contribution and withdrawal is traceable and verifiable. The hash chain makes historical tampering impossible without detection.

**Compliance**: The system enforces balance assertions before commit, integer minor units (no floating-point errors), and immutable entries.

### 4. Credit Facilities with Pool Health (`src/lib/services/credit-service.ts`)

**What it does**: A phased credit system (Formation → Microcredit → Scaling) where:
- **Phase 1**: Members contribute to a buffer; no loans until target reached
- **Phase 2**: Microcredit with Ubuntu Score-based limits
- **Phase 3**: Scaled lending with diversified risk

Pool health is a composite metric (buffer ratio, capital adequacy, default rate, liquidity, asset quality, profitability, growth) that gates new loans.

**Why it matters**: Traditional microfinance exploits the poor with opaque terms. Ubuntu Pools makes credit terms transparent, rates community-driven, and default consequences collective — creating natural incentives for mutual support.

### 5. Village OS — Programmable Economic Units (`src/lib/services/village-service.ts`)

**What it does**: Villages as programmable economic units with:
- **ROSCA Pools** — Rotating savings with automated payout cycles
- **Bulk Procurement** — Collective purchasing with negotiated discounts
- **Investments** — Village-backed local business investments
- **Insurance Pools** — Community mutual insurance systems
- **Governance** — Proposals with sqrt(Ubuntu Score) weighted voting
- **Messaging** — Encrypted village communication channels
- **Economic Graph** — Inter-village trade relationships

**Why it matters**: Villages become self-organizing economic entities that can scale from simple savings circles to complex cooperative structures.

### 6. Collective Procurement & Market Engine — CPME (`src/lib/market/`)

**What it does**: Transforms Ubuntu Pools from a finance platform into a community wealth engine:
- **Procurement Circles** — Village buying collectives
- **Demand Aggregation** — Pool buying power for bulk negotiation
- **Supply Aggregation** — Pool selling power for better prices
- **Supplier Marketplace** — Trust-scored suppliers bidding on demands
- **Contract Management** — Legal agreements between villages and suppliers
- **Order Settlement** — Payment, shipping, delivery tracking
- **Market Intelligence** — Aggregated demand data for insights

**Why it matters**: Communities save 20-40% on purchases and get higher prices for produce by pooling demand/supply. The platform earns 0.5% coordination fees while villages save significantly more.

**Example**: 200 farmers buying seeds individually at R500/bag = R100,000. Aggregated demand of 200 bags → bulk price R380/bag = R76,000. Village saves R24,000.

### 7. Data Sovereignty Framework (`src/lib/privacy/sovereignty.ts`)

**What it does**: Implements the four fundamental data rights:
- **Right to Export** — full data portability
- **Right to Deletion** — complete erasure
- **Right to Portability** — machine-readable export
- **Right to Transparency** — clear processing records

Plus zero-knowledge proofs that verify membership/score without revealing identity.

**Why it matters**: In a trust-based system, members must share data to build reputation. But sharing shouldn't mean surrendering control. This framework gives members granular consent over what data is shared, with whom, and for how long.

### 8. Sybil Defense System (`src/lib/sybil/`)

**What it does**: Multi-layered defense against fake identities:
- **Human Verification** — biometric/liveness checks
- **Device Binding** — hardware attestation
- **Social Anchors** — trusted introducer network
- **Economic Activity** — contribution requirements
- **Diversity Scoring** — detects coordinated attacks
- **Time Trust** — age-weighted scoring
- **Growth Limits** — rate-limiting new membership
- **Village Shield** — collective threat detection

**Why it matters**: Open membership systems are vulnerable to Sybil attacks where one entity creates many fake identities to subvert voting or drain collective resources. These defenses make attack economically unviable.

### 9. Trust Graph & Fraud Detection (`src/lib/trust-graph/`)

**What it does**: Graph-based analysis of member relationships:
- **PageRank** — influence scoring
- **Cluster Detection** — identifies suspicious subgroups
- **Fraud Rings** — detects coordinated fraud patterns
- **Weight Calculator** — relationship strength metrics

**Why it matters**: Individual reputation scores can be gamed through colluding pairs. The trust graph detects patterns that single-metric systems miss.

### 10. Sovereignty Proxy & Matchmaker (`src/lib/services/sovereignty-proxy.ts`)

**What it does**: 
- **Sovereignty Proxy** — NER-based anonymization, intent tag extraction, profile types (blank, ESG, Community Anchor, Entrepreneur), TTL-based data ephemerality
- **Matchmaker** — Signal-to-Asset matching, pool recommendations, Social-Accord Synergy calculation, personalized prosperity opportunities

**Why it matters**: Members can control what data is visible while still receiving personalized recommendations for economic opportunities.

### 11. Lindiwe AI — Autonomous Governance Matriarch (`src/lib/backbone/lindiwe.ts`)

**What it does**: An autonomous governance agent that:
- Monitors pool health, member scores, and system safety
- Triggers SHIELD/PROSPERITY/EMERGENCY modes
- Proposes credit terms and governance adjustments
- Provides natural-language insights via chat
- Controls Matchmaker for personalized opportunities

**Why it matters**: Human governance can't monitor real-time system health. Lindiwe provides continuous vigilance, alerting the collective (via OpenClaw) when intervention is needed.

### 12. OpenClaw Integration (`src/lib/integrations/openclaw/`)

**What it does**: A command-and-control bridge that:
- Receives alerts from Lindiwe
- Sends WhatsApp/Signal notifications to the Founder
- Executes voice/text commands from the Founder
- Provides a "Live Canvas" dashboard

**Why it matters**: The platform needs human override capability. OpenClaw ensures the Founder always retains control while delegating day-to-day operations to autonomous systems.

### 13. Stitch Banking Integration (`src/lib/integrations/stitch/`)

**What it does**: Connects to South African banking infrastructure for:
- Payment initiation
- Account verification
- Transaction categorization
- Balance synchronization

**Why it matters**: Ubuntu Pools bridges collective finance with the formal banking system. Members can contribute from bank accounts and withdraw to them.

### 14. Reputation Friction System (`src/lib/reputation/friction.ts`)

**What it does**: Prevents reputation inflation through multiple mechanisms:
- **Time Decay** — Trust fades with inactivity (90-day half-life)
- **Reputation Age** — Longer membership earns bonus multiplier
- **Diversity Penalty** — Score reduced if endorsements come from too few sources
- **Max Influence Cap** — No single user can have >5% influence on another's score
- **Negative Signal Penalty** — Defaults, fraud, violations reduce score significantly

**Why it matters**: Early crypto reputation systems failed because scores could inflate endlessly. These friction mechanisms keep the Ubuntu Score meaningful and resistant to gaming.

### 15. Village Invite Chain (`src/lib/services/invite-service.ts`)

**What it does**: Trust-based onboarding through invitation chains:
- **Tiered Invites** — Novice (2), Contributor (5), Steward (10), Archivist (unlimited)
- **Risk Sharing** — Inviters lose points if invitees commit fraud
- **Diversity Requirements** — Prevents clique formation
- **Anchor Invitations** — Community leaders get higher quotas

**Why it matters**: Organic growth through trusted relationships, not cold signups. This mirrors how real communities grow and provides natural Sybil protection.

### 16. Portable Economic Passport (`src/lib/identity/passport.ts`)

**What it does**: Zero-knowledge credentials for external verification:
- **Verifiable Credentials** — Cryptographically signed reputation proofs
- **Selective Disclosure** — Share only what's needed (score > 70, no defaults, 2+ years)
- **Portable Trust** — Use Ubuntu Score for banks, employers, cooperatives
- **Base64 Compact Format** — Easy to share via any channel

**Why it matters**: A score of 78 means nothing to a bank in another country. But "verified Ubuntu credential showing score > 75 for 2 years with no defaults" is meaningful. This creates the "economic passport" concept.

### 17. Village Economic Mirror (`src/lib/services/village-mirror.ts`)

**What it does**: Real-time visualization of collective power:
- **Monthly Buying Power** — Sum of all member capacity
- **Village Multiplier** — How much R1 contribution becomes in collective value
- **Eligible Opportunities** — Credit, pools, governance rights based on score
- **Milestone Tracking** — Progress toward collective goals

**Why it matters**: Users understand why they should participate. Instead of "R200 balance" they see "Your R200 unlocks R840 in village buying power."

### 18. Living Village Loop (`src/lib/services/activity-engine.ts`)

**What it does**: Activity feed that makes the village feel alive:
- **Event Types** — Joins, contributions, procurements, investments, governance
- **Priority Ranking** — High (milestones), Medium (contributions), Low (votes)
- **Impact Narratives** — Human-readable activity descriptions
- **Time-Ago Formatting** — "2h ago", "3d ago"

**Why it matters**: Traditional apps feel static. This makes the platform feel like a living village where something meaningful happens every day.

---

## Technical Decisions Explained

### Why Next.js 16 + React 19?

The App Router provides the ideal balance of server-side security (for governance rules) and client-side interactivity (for dashboards). Server Components by default reduce JavaScript payload while `"use client"` annotations make boundary management explicit.

### Why Drizzle ORM?

Drizzle provides type-safe SQL without the abstraction overhead of full ORMs. It's lean, fast, and SQL-first — appropriate for a system where financial integrity is paramount.

### Why WebSocket over HTTP Polling?

Real-time updates are essential for governance votes, pool health changes, and collective activity feeds. WebSocket provides the low-latency communication the platform requires.

### Why Zero-Knowledge Proofs?

The platform must verify membership and creditworthiness without collecting sensitive identity data. ZK proofs enable a member to prove "my Ubuntu Score > 70" without revealing their actual score or identity.

---

## Phase Roadmap

| Phase | Name | Status |
|-------|------|--------|
| 1 | Foundation (Ledger, Events, Posting Engine) | ✅ Complete |
| 2 | Compliance & Privacy | ✅ Complete |
| 3 | Trust System & Observability | ✅ Complete |
| 4 | Trust-Based Governance | ✅ Complete |
| 5 | Tokenized Commons (Future) | 🔮 |
| 6 | Credit Facilities | ✅ Complete |
| 7 | Sovereignty & Matchmaker | ✅ Complete |
| 8 | Backbone (Lindiwe AI) | ✅ Complete |
| 9 | Observability Infrastructure | ✅ Complete |
| 10 | Social Networking | ✅ Complete |
| 11 | Village OS | ✅ Complete |
| 12 | CPME (Collective Procurement) | ✅ Complete |
| 13 | Trust Enhancement (Friction, Invites, Passport) | ✅ Complete |
| 14 | Portable Economic Passport | 🔮 |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Bun (recommended) or npm/yarn
- PostgreSQL database (for production)

### Quick Start

```bash
# Install dependencies (auto-fixes known vulnerabilities)
bun install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your DATABASE_URL

# Run database migrations (in order)
psql $DATABASE_URL < src/db/migrations/0001_phase1_foundation.sql
psql $DATABASE_URL < src/db/migrations/0002_village_os.sql
psql $DATABASE_URL < src/db/migrations/0003_cpme.sql
psql $DATABASE_URL < src/db/migrations/0004_trust_enhancement.sql
psql $DATABASE_URL < src/db/migrations/0005_security_controls.sql

# Run development server
bun dev
```

### Security & Dependencies

```bash
# Run security audit
bun audit

# Fix vulnerabilities (semver-safe updates)
bun audit:fix
# or
bun update

# Fix all vulnerabilities (including breaking changes)
bun update --latest
```

Visit `http://localhost:3000` to see the platform.

### Run Tests

```bash
bun test              # All tests
bun test:watch        # Watch mode
bun test:coverage     # Coverage report
```

### Type Check & Lint

```bash
bun typecheck        # TypeScript validation
bun lint             # Code quality
```

---

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `src/app/` | Next.js App Router pages and API routes |
| `src/components/` | React UI components organized by feature |
| `src/lib/` | Core business logic, services, and utilities |
| `src/db/` | Drizzle ORM schema and migrations |
| `src/tests/` | Vitest test suite |

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| Next.js | 16 | React framework with App Router |
| React | 19 | UI library |
| Tailwind CSS | 4 | Utility-first styling |
| Framer Motion | latest | Animation library |
| Drizzle ORM | latest | Type-safe database access |
| PostgreSQL | latest | Primary data store |
| Socket.io | latest | Real-time WebSocket communication |
| Zod | latest | Schema validation |
| Vitest | latest | Testing framework |

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/events` | GET/POST | Event log |
| `/api/ledger` | GET | Transaction history |
| `/api/members` | GET/POST | Member management |
| `/api/villages` | GET/POST | Village operations |
| `/api/villages/[id]/pools` | GET/POST | ROSCA pools |
| `/api/villages/[id]/proposals` | GET/POST | Governance |
| `/api/credit` | GET/POST | Credit facilities |
| `/api/credit/score` | GET | Ubuntu Score |
| `/api/sovereignty` | POST/GET | Data rights |
| `/api/matchmaker` | POST/GET | Prosperity matching |
| `/api/backbone` | GET/POST | Lindiwe AI |
| `/api/cpme` | GET/POST | Collective Procurement |
| `/api/invites` | GET/POST | Invite chain management |
| `/api/passport` | POST | Portable credential issuance |
| `/api/mirror` | GET | Village economic mirror |
| `/api/activity` | GET | Living village activity feed |
| `/api/reputation` | GET | Trust scores |

---

## Documentation

- [CPME Operations Guide](docs/cpme-operations.md) — Full API reference for Collective Procurement & Market Engine
- [Phase 3 Transformation](docs/phase3-ubuntu-transformation.md) — Technical roadmap
- [Phase 2 Compliance](docs/phase2-compliance.md) — Legal framework
- [ADR-015: Crypto Shredding](docs/adr/015-crypto-shredding.md)
- [ADR-016: PII-Free Events](docs/adr/016-pii-free-events.md)

---

## Contributing

This platform is designed for community ownership. To contribute:

1. Fork the repository
2. Create a feature branch
3. Run tests and typecheck
4. Submit a pull request

All contributors agree to the Governance Charter upon their first contribution.

---

## License

MIT
