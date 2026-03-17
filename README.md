# Ubuntu Pools Platform

> *"I am because we are"* — A collective prosperity system with trust-based governance, immutable ledger, and community-driven impact.

---

## Table of Contents

1. [Conceptualization & Philosophy](#conceptualization--philosophy)
2. [Architecture Overview](#architecture-overview)
3. [Codebase Structure](#codebase-structure)
4. [Getting Started](#getting-started)
5. [Development Guide](#development-guide)
6. [Feature Integration](#feature-integration)
7. [Testing](#testing)
8. [Scaling Strategies](#scaling-strategies)
9. [Deployment](#deployment)
10. [Future Aspirations](#future-aspirations)
11. [Troubleshooting](#troubleshooting)

---

## Conceptualization & Philosophy

### The African Philosophy of Ubuntu

Ubuntu Pools operationalizes the African philosophy of "I am because we are" through technology. This isn't merely a financial platform—it's a digital embodiment of collective interdependence where community members pool resources, build trust through transparent governance, and create sustainable prosperity circles that transcend traditional financial systems.

### The Three Fundamental Challenges

#### 1. Trust Deficits

Traditional systems require centralized authorities to establish trust—credit bureaus, banks, governments. Ubuntu Pools replaces these intermediaries with a cryptographically verifiable, peer-attested reputation system. Trust is earned through demonstrated reciprocity and community contribution, not through bureaucratic gatekeepers.

#### 2. Financial Exclusion

Billions remain unbanked or underbanked, excluded from traditional financial systems due to lack of collateral, credit history, or acceptable identification. Ubuntu Pools' zero-knowledge proofs and privacy-preserving architecture allow participation without revealing sensitive personal data. Your reputation precedes you, not your paperwork.

#### 3. Individual Vulnerability

Individual families face catastrophic risk from single-point failures—medical emergencies, job loss, crop failures. The collective structure distributes risk across the village while maintaining individual sovereignty. No one succeeds alone; everyone rises together.

### The Ubuntu Score

At the heart of the platform lies the Ubuntu Score (0-100), a composite reputation metric calculated from five weighted components:

| Component | Weight | Description |
|-----------|--------|-------------|
| Reciprocity Index | 25% | Ratio of help given vs. received |
| Consistency Score | 20% | Activity spread over 30-day windows |
| Community Endorsements | 20% | Peer attestations received |
| Governance Participation | 20% | Proposal and voting engagement |
| Resource Sharing | 15% | Value contributed to commons |

The score gates access to credit facilities, governance rights, and village membership—determined by demonstrated commitment, not static identity data.

### Authority Levels

The system maps scores to five tiers, each with escalating privileges:

- **Novice (0-19)**: View-only access, can receive but not give endorsements
- **Contributor (20-39)**: Full participation, can create proposals
- **Steward (40-59)**: Can approve new members, moderate discussions
- **Guardian (60-79)**: Can modify governance parameters, access credit facilities
- **Archivist (80-100)**: Emergency constitutional powers, can call governance freezes

---

## Architecture Overview

### System Design Philosophy

Ubuntu Pools follows a microservices-inspired architecture within a monorepo, enabling independent development of features while maintaining system cohesion. The architecture prioritizes:

1. **Event Sourcing**: All state changes are captured as immutable events, enabling complete audit trails
2. **Domain-Driven Design**: Clear bounded contexts for different business capabilities
3. **Privacy by Design**: Zero-knowledge proofs and cryptographic shredding protect user data
4. **Autonomous Operations**: Lindiwe AI provides continuous system monitoring and governance assistance

### High-Level Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ Web App     │  │ Mobile Web  │  │ API Clients │  │ WebSocket  │ │
│  │ (Next.js 16)│  │ (PWA)       │  │ (External)  │  │ (Real-time)│ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY LAYER                            │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Next.js API Routes (REST) + Socket.io (WebSocket)              ││
│  │ - /api/events     - /api/villages    - /api/credit             ││
│  │ - /api/ledger    - /api/sovereignty  - /api/cpme               ││
│  │ - /api/matchmaker - /api/backbone   - /api/passport           ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
┌─────────────────┐   ┌─────────────────────┐   ┌─────────────────────────┐
│ IDENTITY LAYER  │   │  TRUST & REPUTATION │   │  GOVERNANCE ENGINE      │
├─────────────────┤   ├─────────────────────┤   ├─────────────────────────┤
│ • Keypair mgmt  │   │ • Trust Graph       │   │ • Constitution engine   │
│ • Score proofs  │   │ • Sybil defense     │   │ • Proposals & voting   │
│ • Passport      │   │ • Reputation engine │   │ • Quorum enforcement    │
│ • Action verify │   │ • Fraud detection  │   │ • Emergency protocols  │
└─────────────────┘   └─────────────────────┘   └─────────────────────────┘
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐   ┌─────────────────────┐   ┌─────────────────────────┐
│ VILLAGE OS      │   │  CREDIT FACILITIES   │   │  CPME (Market Engine)    │
├─────────────────┤   ├─────────────────────┤   ├─────────────────────────┤
│ • ROSCA pools   │   │ • Buffer formation  │   │ • Procurement circles    │
│ • Bulk buying   │   │ • Microcredit       │   │ • Demand aggregation    │
│ • Insurance     │   │ • Scaling loans    │   │ • Supply aggregation    │
│ • Economic graph│   │ • Pool health      │   │ • Supplier marketplace   │
└─────────────────┘   └─────────────────────┘   └─────────────────────────┘
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      INFRASTRUCTURE LAYER                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ PostgreSQL  │  │   Redis     │  │   Sentry    │  │  WebSocket │ │
│  │ (Primary)   │  │  (Cache)    │  │ (Monitoring)│  │  Server    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  Upstash   │  │   Stitch    │  │  OpenClaw   │  │  Clerk     │ │
│  │ (Rate Limit)│  │ (Banking)  │  │ (Command)   │  │ (Auth)     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Codebase Structure

### Root Directory Organization

```
ubuntu-pools/
├── .env.local.example          # Environment template
├── .gitignore                  # Git exclusions
├── AGENTS.md                   # AI agent instructions
├── CLAUDE.md                   # Claude AI context
├── drizzle.config.ts           # Drizzle ORM configuration
├── eslint.config.mjs           # ESLint configuration
├── next.config.ts              # Next.js configuration
├── OPERATIONS.md               # Operations documentation
├── OPERATIONS_SCOPE.md         # Operations scope definition
├── package.json                 # Dependencies and scripts
├── postcss.config.mjs          # PostCSS/Tailwind configuration
├── README.md                   # This file
├── SECURITY.md                 # Security policies
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── vitest.config.ts            # Vitest testing configuration
├── docker-compose.yml          # Docker Compose for local dev
├── trust-security-controls.md  # Trust security documentation
│
├── src/                        # Source code
│   ├── app/                    # Next.js App Router
│   ├── components/            # React UI components
│   ├── lib/                   # Core business logic
│   ├── db/                    # Database schemas & migrations
│   └── tests/                 # Test suite
│
├── docs/                       # Documentation
│   ├── adr/                   # Architecture Decision Records
│   ├── phase2-compliance.md   # Phase 2 compliance docs
│   └── phase3-ubuntu-transformation.md
│
├── code-review/                # Code review artifacts
├── tools/                      # Utility scripts
└── openclaw-skills/           # OpenClaw skill definitions
```

### Detailed Source Structure

#### `src/app/` - Next.js App Router

The App Router uses file-based routing with React Server Components by default:

```
src/app/
├── layout.tsx                  # Root layout with providers
├── page.tsx                    # Main dashboard (activity feed)
├── globals.css                 # Tailwind CSS + custom properties
│
├── api/                        # API routes (REST endpoints)
│   ├── backbone/               # Lindiwe AI endpoints
│   ├── cpme/                   # Collective Procurement endpoints
│   ├── credit/                 # Credit facility endpoints
│   ├── events/                 # Event log endpoints
│   ├── invites/               # Invite chain endpoints
│   ├── ledger/                # Ledger query endpoints
│   ├── matchmaker/            # Matchmaker endpoints
│   ├── members/               # Member management
│   ├── villages/              # Village operations
│   │   ├── [id]/
│   │   │   ├── page.tsx       # Village detail page
│   │   │   ├── pools/         # ROSCA pool endpoints
│   │   │   └── proposals/     # Village governance
│   │   └── page.tsx          # Villages list
│   ├── passport/             # Credential issuance
│   ├── profile/              # User profile
│   ├── reputation/           # Score queries
│   ├── search/               # Search functionality
│   ├── sovereignty/          # Data rights endpoints
│   ├── messages/             # Direct messaging
│   ├── notifications/        # Notification endpoints
│   ├── mirror/               # Village economic mirror
│   └── activity/             # Activity feed
│
├── village/                    # Village pages
├── profile/                    # User profile pages
├── messages/                   # Messaging pages
├── notifications/              # Notification pages
└── search/                     # Search pages
```

#### `src/lib/` - Core Business Logic

The `lib` directory is organized by domain:

```
src/lib/
├── access/                     # RBAC & consent management
│   ├── middleware.ts          # Request authorization
│   └── types.ts               # Permission types
│
├── api/                        # API utilities
│   ├── handlers/              # Request handlers
│   └── validation/            # Input validation
│
├── auth/                       # Authentication
│   ├── middleware.ts          # Auth middleware
│   └── clerk/                 # Clerk integration
│
├── backbone/                   # Lindiwe AI (Central Nervous System)
│   ├── controller.ts          # Request controller
│   ├── lindiwe.ts            # Main AI implementation
│   └── matchmaker.ts         # Opportunity matching
│
├── bank-provider/              # Banking abstraction
│   ├── index.ts               # Provider interface
│   ├── stitch.ts              # Stitch integration
│   └── types.ts               # Banking types
│
├── cache/                      # Caching layer
│   ├── engine.ts              # Cache implementation
│   └── keys.ts               # Cache key definitions
│
├── custody/                    # Asset custody
│   └── adapters.ts            # Custody adapters
│
├── events/                     # Event system
│   ├── emitter.ts             # Event dispatcher
│   ├── hasher.ts              # Event hashing
│   ├── schemas.ts             # Event schemas
│   ├── schemas-credit.ts      # Credit events
│   ├── signature-verifier.ts  # Event signatures
│   └── index.ts              # Event exports
│
├── eventsourcing/              # Event sourcing core
│   ├── core.ts               # Aggregate roots
│   └── index.ts
│
├── features/                   # Feature flags
│   └── feature-flags.ts
│
├── governance/                 # Governance engine
│   ├── constitution.ts         # Constitution rules
│   ├── gate.ts                # Proposal gate
│   └── index.ts
│
├── identity/                   # Identity & credentials
│   ├── action-verifier.ts    # Action verification
│   ├── keypair-manager.ts    # Key management
│   ├── passport.ts            # Economic passport
│   └── score-proof.ts        # Score proofs (ZK)
│
├── integrations/               # External integrations
│   ├── openclaw/             # OpenClaw gateway
│   │   ├── gateway.ts        # API gateway
│   │   ├── event-handlers.ts # Event handlers
│   │   └── index.ts
│   └── stitch/               # Stitch banking
│       ├── provider.ts
│       └── index.ts
│
├── ledger/                     # Immutable ledger
│   ├── merkle.ts              # Merkle tree
│   ├── posting-engine.ts     # Double-entry posting
│   ├── queries.ts             # Ledger queries
│   └── snapshot.ts           # Ledger snapshots
│
├── market/                     # CPME (Market Engine)
│   └── index.ts
│
├── observability/              # Monitoring & logging
│   ├── index.ts
│   ├── logger.ts              # Structured logging
│   ├── performance.ts         # Performance tracking
│   ├── sentry.ts             # Sentry integration
│   └── service.ts            # Observability service
│
├── openclaw/                   # Executive shadow gateway
│   └── gateway.ts
│
├── performance/               # Performance optimizations
│   └── edge.ts
│
├── privacy/                    # Privacy & data sovereignty
│   └── sovereignty.ts         # Four fundamental rights
│
├── reputation/                 # Trust score engine
│   ├── engine.ts              # Score calculation
│   └── friction.ts            # Anti-inflation mechanisms
│
├── services/                  # Business logic services
│   ├── activity-engine.ts    # Activity feed
│   ├── credit-service.ts     # Credit facilities
│   ├── event-service.ts      # Event handling
│   ├── invite-service.ts      # Invite chains
│   ├── ledger-service.ts      # Ledger operations
│   ├── matchmaker.ts         # Opportunity matching
│   ├── proposal-service.ts   # Governance proposals
│   ├── score-guards.ts       # Score validation
│   ├── security-controls-service.ts
│   ├── service-bus.ts        # Message bus
│   ├── sovereignty-proxy.ts  # Anonymization
│   ├── verifiable-score.ts   # Score verification
│   ├── village-mirror.ts     # Economic visualization
│   └── village-service.ts    # Village operations
│
├── sybil/                      # Sybil attack defense
│   ├── decision-engine.ts    # Attack detection
│   ├── device-binding.ts      # Hardware attestation
│   ├── diversity-scoring.ts   # Attack pattern detection
│   ├── economic-activity.ts  # Activity requirements
│   ├── growth-limits.ts      # Rate limiting
│   ├── human-verification.ts # Biometric checks
│   ├── permissions.ts        # Permission system
│   ├── social-anchors.ts     # Trusted introducers
│   ├── time-trust.ts         # Age-weighted scoring
│   ├── types.ts
│   └── village-shield.ts     # Collective detection
│
├── trust-graph/                # Graph-based fraud detection
│   ├── cluster-detector.ts   # Suspicious clusters
│   ├── fraud-detection.ts    # Fraud pattern detection
│   ├── graph-engine.ts       # Graph operations
│   ├── hierarchy.ts           # Trust hierarchy
│   ├── integrations.ts       # External integrations
│   ├── pagerank.ts           # Influence scoring
│   ├── privacy-layer.ts      # Privacy-preserving queries
│   ├── score-calculator.ts  # Graph-based scoring
│   ├── types.ts
│   ├── weight-calculator.ts # Relationship weights
│   └── index.ts
│
└── websocket/                  # Real-time communication
    ├── client.ts              # WebSocket client
    └── server.ts              # WebSocket server
```

#### `src/components/` - UI Components

```
src/components/
├── backbone/                   # Lindiwe AI UI
├── collective/                # Timebank & contributions
├── credit/                    # Credit dashboard
├── dashboard/                 # Trust & technical dashboards
├── governance/                # Proposal & voting UI
├── home/                      # FAQ, tiers, activity
├── ledger/                    # Transaction display
├── lindiwe/                   # AI governance assistant
├── privacy/                   # Sovereignty controls
├── sovereignty/               # Data rights management
├── stitch/                    # Banking integration UI
├── village/                   # Village UI components
│   ├── pools/                # ROSCA pool components
│   ├── circles/              # Village circles
│   └── commons/              # Shared resources
└── ui/                        # Shared UI components
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    ├── modal.tsx
    └── ...
```

#### `src/db/` - Database Layer

```
src/db/
├── client.ts                  # Database client
├── migrations/               # Drizzle migrations
│   ├── 0001_phase1_foundation.sql
│   ├── 0002_village_os.sql
│   ├── 0003_cpme.sql
│   ├── 0004_trust_enhancement.sql
│   └── 0005_security_controls.sql
├── schema.ts                  # Core schema
├── schema-credit.ts           # Credit schema
├── schema-cpme.ts            # CPME schema
├── schema-invite.ts          # Invite schema
├── schema-village.ts         # Village schema
└── seed.ts                   # Database seed
```

#### `src/tests/` - Test Suite

```
src/tests/
├── credit.test.ts            # Credit facilities
├── hasher.test.ts            # Event hashing
├── merkle.test.ts            # Merkle tree
├── observability.test.ts     # Monitoring
├── phase2-custody.test.ts    # Custody
├── phase3-governance.test.ts # Governance
├── posting-engine.test.ts    # Ledger posting
├── privacy.test.ts           # Data sovereignty
├── reputation.test.ts        # Trust scoring
├── schemas.test.ts           # Schema validation
├── score-guards.test.ts      # Score validation
├── sybil-defense.test.ts     # Sybil protection
├── trust-graph.test.ts       # Graph operations
└── zero-trust-identity.test.ts # Identity system
```

---

## Getting Started

### Prerequisites

Before beginning development, ensure your environment meets these requirements:

#### Software Requirements

| Tool | Version | Purpose |
|------|---------|---------|
| **Bun** | Latest | Package manager and runtime (REQUIRED) |
| **Node.js** | 20+ | JavaScript runtime |
| **PostgreSQL** | 14+ | Primary database |
| **Redis** | 7+ | Caching and rate limiting |

#### Accounts & Access

| Service | Purpose | Required For |
|---------|---------|--------------|
| Clerk | Authentication | Development |
| Sentry | Error tracking | Development |
| Upstash | Rate limiting | Development |
| Stitch | Banking (South Africa) | Production |
| OpenClaw | Command & control | Production |

### Quick Start

Follow these steps to get the platform running locally:

```bash
# 1. Clone and navigate to the project
cd ubuntu-pools

# 2. Install dependencies (auto-fixes known vulnerabilities)
bun install

# 3. Copy environment template
cp .env.local.example .env.local

# 4. Configure environment variables in .env.local
# Required variables:
# DATABASE_URL=postgresql://user:pass@localhost:5432/ubuntu_pools
# CLERK_SECRET_KEY=sk_test_...
# SENTRY_DSN=...
# UPSTASH_REDIS_REST_URL=...
# UPSTASH_REDIS_REST_TOKEN=...
# STITCH_CLIENT_ID=...
# STITCH_SECRET_KEY=...
# OPENCLAW_API_KEY=...

# 5. Set up the database
# Option A: Run migrations manually
psql $DATABASE_URL < src/db/migrations/0001_phase1_foundation.sql
psql $DATABASE_URL < src/db/migrations/0002_village_os.sql
psql $DATABASE_URL < src/db/migrations/0003_cpme.sql
psql $DATABASE_URL < src/db/migrations/0004_trust_enhancement.sql
psql $DATABASE_URL < src/db/migrations/0005_security_controls.sql

# Option B: Use Docker Compose (recommended)
docker-compose up -d postgres redis

# 6. Run the development server
bun dev
```

### Verify Installation

Once running, verify the installation:

```bash
# Test the API health
curl http://localhost:5000/api/health

# Run the test suite
bun test

# Check TypeScript compilation
bun typecheck

# Run linting
bun lint
```

Visit `http://localhost:5000` to access the platform.

---

## Development Guide

### Development Workflow

#### 1. Creating a New Feature

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... implement feature ...

# Run tests
bun test

# Run type checking
bun typecheck

# Run linting
bun lint

# Commit your changes
git add -A
git commit -m "feat: add your feature"
```

#### 2. Understanding Event Flow

The platform uses event sourcing. Every state change creates an event:

```typescript
// Example: Creating a contribution event
import { emitEvent } from '@/lib/events/emitter';

const event = await emitEvent({
  type: 'CONTRIBUTION_CREATED',
  payload: {
    memberId: 'user_123',
    villageId: 'village_456',
    amount: 10000, // minor units
    poolId: 'pool_789',
    timestamp: Date.now()
  },
  metadata: {
    ipAddress: request.headers.get('x-forwarded-for'),
    userAgent: request.headers.get('user-agent')
  }
});
```

Events are:
- Cryptographically hashed with SHA-256
- Signed by the acting member's keypair
- Stored in append-only event log
- Processed by domain-specific handlers

#### 3. Working with the Trust Graph

```typescript
import { TrustGraph } from '@/lib/trust-graph';

// Calculate trust score for a member
const score = await TrustGraph.calculateScore('member_123');

// Get fraud indicators
const fraudReport = await TrustGraph.detectFraud('member_123');

// Query relationships
const relationships = await TrustGraph.getRelationships('member_123', {
  depth: 2,
  includeWeights: true
});
```

#### 4. Implementing Governance Proposals

```typescript
import { ProposalService } from '@/lib/services/proposal-service';

const proposal = await ProposalService.create({
  title: 'Increase village contribution minimum',
  description: 'Proposal to increase minimum monthly contribution from R100 to R150',
  type: 'PARAMETER_CHANGE',
  villageId: 'village_456',
  proposerId: 'member_123',
  votingPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
  parameters: {
    key: 'MINIMUM_CONTRIBUTION',
    currentValue: 10000,
    proposedValue: 15000
  }
});

// Vote on proposal
await ProposalService.vote({
  proposalId: proposal.id,
  voterId: 'member_789',
  choice: 'YES',
  weight: 45 // Ubuntu Score
});
```

#### 5. Adding Sybil Defense Checks

```typescript
import { SybilDefense } from '@/lib/sybil/decision-engine';

const verification = await SybilDefense.verifyIdentity({
  memberId: 'member_123',
  checks: ['human', 'device', 'economic', 'social'],
  strictMode: true
});

if (!verification.passed) {
  throw new Error(`Sybil verification failed: ${verification.reasons.join(', ')}`);
}
```

### Code Conventions

#### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `VillageCard.tsx` |
| Utilities | camelCase | `calculateScore.ts` |
| Types | PascalCase | `TrustTypes.ts` |
| Constants | UPPER_SNAKE_CASE | `MAX_CONTRIBUTION.ts` |
| Config | camelCase | `featureFlags.ts` |

#### Component Patterns

**Server Component (default):**
```typescript
// src/components/VillageList.tsx
export default async function VillageList() {
  const villages = await db.query.villages.findMany();
  
  return (
    <div>
      {villages.map(village => (
        <VillageCard key={village.id} village={village} />
      ))}
    </div>
  );
}
```

**Client Component (when needed):**
```typescript
// src/components/ContributionForm.tsx
"use client";

import { useState } from 'react';

export function ContributionForm() {
  const [amount, setAmount] = useState(0);
  
  return (
    <input 
      type="number" 
      value={amount}
      onChange={(e) => setAmount(Number(e.target.value))}
    />
  );
}
```

#### Error Handling

Always use proper error handling with appropriate HTTP status codes:

```typescript
// Good: Descriptive errors with appropriate status codes
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.villageId) {
      return NextResponse.json(
        { error: 'Village ID is required' },
        { status: 400 }
      );
    }
    
    const result = await processContribution(data);
    
    return NextResponse.json(result, { status: 201 });
    
  } catch (error) {
    // Log error for observability
    logger.error('Contribution processing failed', { error, data });
    
    return NextResponse.json(
      { error: 'Failed to process contribution' },
      { status: 500 }
    );
  }
}
```

#### Database Operations

Use Drizzle ORM for type-safe queries:

```typescript
import { db } from '@/db/client';
import { villages, members } from '@/db/schema';

const villageWithMembers = await db
  .select({
    id: villages.id,
    name: villages.name,
    memberCount: sql<number>`count(${members.id})`
  })
  .from(villages)
  .leftJoin(members, eq(villages.id, members.villageId))
  .groupBy(villages.id);
```

---

## Feature Integration

### Adding a New Service

To add a new business logic service:

1. **Create the service file:**
```typescript
// src/lib/services/new-service.ts
import { db } from '@/db/client';
import { eventEmitter } from '@/lib/events/emitter';

export class NewService {
  static async processRequest(data: RequestData): Promise<Result> {
    // Implementation
    await eventEmitter.emit({
      type: 'REQUEST_PROCESSED',
      payload: { ...data, result: 'success' }
    });
    return result;
  }
}
```

2. **Create the API route:**
```typescript
// src/app/api/new-service/route.ts
import { NextResponse } from 'next/server';
import { NewService } from '@/lib/services/new-service';

export async function POST(request: Request) {
  const data = await request.json();
  const result = await NewService.processRequest(data);
  return NextResponse.json(result);
}
```

3. **Add tests:**
```typescript
// src/tests/new-service.test.ts
import { describe, it, expect } from 'vitest';
import { NewService } from '@/lib/services/new-service';

describe('NewService', () => {
  it('should process requests correctly', async () => {
    const result = await NewService.processRequest({ test: true });
    expect(result.status).toBe('success');
  });
});
```

### Integrating a New Bank Provider

The platform uses an adapter pattern for banking integrations:

1. **Define the interface:**
```typescript
// src/lib/bank-provider/types.ts
export interface BankProvider {
  initiatePayment(params: PaymentParams): Promise<PaymentResult>;
  verifyAccount(accountNumber: string): Promise<AccountDetails>;
  getTransactions(accountId: string): Promise<Transaction[]>;
}
```

2. **Implement the adapter:**
```typescript
// src/lib/bank-provider/newbank.ts
import { BankProvider } from './types';

export class NewBankAdapter implements BankProvider {
  async initiatePayment(params: PaymentParams): Promise<PaymentResult> {
    // Implementation for new bank
  }
  
  async verifyAccount(accountNumber: string): Promise<AccountDetails> {
    // Implementation
  }
}
```

3. **Register in the provider registry:**
```typescript
// src/lib/bank-provider/index.ts
import { NewBankAdapter } from './newbank';

export const providers = {
  stitch: new StitchAdapter(),
  newbank: new NewBankAdapter(),
};
```

### Extending Sybil Defense

Add new verification methods to the Sybil defense system:

```typescript
// src/lib/sybil/new-verification.ts
import { SybilCheck } from './types';

export const newVerificationMethod: SybilCheck = {
  name: 'new_method',
  async verify(context: VerificationContext): Promise<CheckResult> {
    // Implement verification logic
    return {
      passed: true,
      score: 10,
      reasons: []
    };
  }
};

// Register in decision engine
import { SybilDefense } from './decision-engine';
SybilDefense.registerCheck(newVerificationMethod);
```

### Adding Governance Rules

Extend the constitution engine:

```typescript
// src/lib/governance/new-rules.ts
import { GovernanceRule } from './types';

export const newRule: GovernanceRule = {
  id: 'NEW_PARAMETER_RULE',
  name: 'New Parameter Change Rule',
  evaluate(proposal: Proposal, context: GovernanceContext): boolean {
    // Rule implementation
    return proposal.parameters.newParam === context.currentValue * 1.1;
  },
  priority: 5
};
```

### Feature Flags

Control feature rollout with feature flags:

```typescript
// src/lib/features/feature-flags.ts
import { getFlag } from './feature-flags';

if (await getFlag('new_credit_product')) {
  await CreditService.launchNewProduct();
}

// In API routes
export async function GET() {
  const enabled = await getFlag('beta_dashboard');
  
  if (!enabled) {
    return NextResponse.json({ error: 'Not enabled' }, { status: 404 });
  }
  
  return NextResponse.json({ data: await getDashboardData() });
}
```

---

## Testing

### Running Tests

```bash
# Run all tests once
bun test

# Run tests in watch mode (auto-reload on changes)
bun test:watch

# Run tests with coverage report
bun test:coverage

# Run specific test file
bun test src/tests/trust-graph.test.ts
```

### Test Structure

Tests follow the Arrange-Act-Assert pattern:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('TrustGraph', () => {
  let graph: TrustGraph;
  
  beforeEach(() => {
    graph = new TrustGraph();
  });
  
  describe('calculateScore', () => {
    it('should return 0 for new members', async () => {
      // Arrange
      const newMemberId = 'new_member';
      
      // Act
      const score = await graph.calculateScore(newMemberId);
      
      // Assert
      expect(score.total).toBe(0);
    });
    
    it('should increase score with endorsements', async () => {
      // Arrange
      await graph.addEndorsement('member_a', 'member_b', 50);
      
      // Act
      const score = await graph.calculateScore('member_b');
      
      // Assert
      expect(score.total).toBeGreaterThan(0);
    });
  });
});
```

### Test Coverage Goals

| Module | Minimum Coverage |
|--------|-----------------|
| Core Services | 90% |
| Trust Graph | 85% |
| Sybil Defense | 85% |
| Governance | 80% |
| Ledger | 95% |
| Privacy | 90% |

---

## Scaling Strategies

### Horizontal Scaling

The platform is designed for horizontal scaling at multiple layers:

#### API Layer
- Deploy multiple Next.js instances behind a load balancer
- Use sticky sessions for WebSocket connections
- Implement rate limiting at the edge (Upstash)

#### Database Layer
- Read replicas for query-heavy operations
- Connection pooling (PgBouncer)
- Partition large tables (events, ledger entries)

#### Caching Strategy
- Redis for session data and frequently accessed queries
- CDN for static assets
- Application-level caching for computed scores

### Performance Optimization

#### Database Indexing

Create indexes for common query patterns:

```sql
-- Index for member lookups by score range
CREATE INDEX idx_members_ubuntu_score ON members(ubuntu_score DESC);

-- Index for event queries by timestamp and type
CREATE INDEX idx_events_type_time ON events(type, timestamp DESC);

-- Composite index for village membership
CREATE INDEX idx_village_members_village ON village_members(village_id, member_id);
```

#### Query Optimization

Use Drizzle's query optimization:

```typescript
// Bad: N+1 query problem
const villages = await db.select().from(villages);
for (const village of villages) {
  const members = await db.select().from(members).where(eq(members.villageId, village.id));
}

// Good: Single query with join
const villagesWithMembers = await db
  .select({
    id: villages.id,
    name: villages.name,
    memberCount: sql<number>`count(${members.id})`
  })
  .from(villages)
  .leftJoin(members, eq(villages.id, members.villageId))
  .groupBy(villages.id);
```

#### Edge Computing

Offload compute to the edge:

```typescript
// Use edge runtime for simple API routes
export const runtime = 'edge';

export async function GET(request: Request) {
  // Fast edge computation
  const result = await fetch('https://edge-function.example.com');
  return NextResponse.json(result);
}
```

### Capacity Planning

| Metric | Small (1000 users) | Medium (10K) | Large (100K) |
|--------|-------------------|--------------|--------------|
| PostgreSQL | 1 primary | 1 primary + 1 replica | 1 primary + 3 replicas |
| Redis | 1 instance | 1 primary + 1 replica | Cluster mode |
| Next.js instances | 2 | 4 | 10+ |
| Memory per instance | 512MB | 1GB | 2GB |

---

## Deployment

### Environment Setup

#### Development
```bash
bun install
cp .env.local.example .env.local
# Configure local environment
bun dev
```

#### Staging
```bash
# Deploy to staging
DATABASE_URL=$STAGING_DB_URL \
CLERK_SECRET_KEY=$STAGING_CLERK \
bun run start
```

#### Production
Use the following environment configuration:

```bash
# Required Production Environment Variables
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_live_...
SENTRY_DSN=https://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
STITCH_CLIENT_ID=...
STITCH_SECRET_KEY=...
OPENCLAW_API_KEY=...

# Security
NODE_ENV=production
ENABLE_RATE_LIMITING=true
LOG_LEVEL=warn
```

### Docker Deployment

```bash
# Build the image
docker build -t ubuntu-pools:latest .

# Run with docker-compose
docker-compose up -d

# Or run manually
docker run -d \
  --name ubuntu-pools \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e CLERK_SECRET_KEY=sk_live_... \
  ubuntu-pools:latest
```

### Kubernetes Deployment

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ubuntu-pools
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ubuntu-pools
  template:
    metadata:
      labels:
        app: ubuntu-pools
    spec:
      containers:
      - name: app
        image: ubuntu-pools:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: ubuntu-pools-secrets
              key: database-url
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Monitoring & Alerting

#### Sentry Configuration

```typescript
// src/lib/observability/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  integrations: [
    Sentry.httpIntegration(),
    Sentry.redisIntegration(),
  ],
});
```

#### Health Check Endpoints

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || 'dev',
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
    }
  };
  
  const isHealthy = Object.values(health.checks).every(c => c === 'ok');
  
  return NextResponse.json(health, {
    status: isHealthy ? 200 : 503
  });
}
```

---

## Future Aspirations

### Phase Roadmap

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 1 | Foundation | ✅ Complete | Ledger, Events, Posting Engine |
| 2 | Compliance | ✅ Complete | Privacy, data sovereignty |
| 3 | Trust System | ✅ Complete | Trust Graph, Observability |
| 4 | Governance | ✅ Complete | Constitution engine, proposals |
| 5 | Tokenized Commons | 🔮 Future | Tokenized community assets |
| 6 | Credit Facilities | ✅ Complete | Pool-based lending |
| 7 | Sovereignty | ✅ Complete | Data rights, Matchmaker |
| 8 | Backbone | ✅ Complete | Lindiwe AI integration |
| 9 | Observability | ✅ Complete | Monitoring infrastructure |
| 10 | Social | ✅ Complete | Messaging, networking |
| 11 | Village OS | ✅ Complete | ROSCA pools, insurance |
| 12 | CPME | ✅ Complete | Collective procurement |
| 13 | Trust Enhancement | ✅ Complete | Friction, invites, passport |
| 14 | Portable Passport | 🔮 Future | External credential verification |

### Vision: Global Ubuntu Network

The long-term vision is to create a global network of Ubuntu Pools:

1. **Inter-Village Trading**: Villages can trade with each other directly
2. **Cross-Border Finance**: Portable reputation enabling international transactions
3. **Ubuntu Standards**: Open protocols for trust-based systems
4. **Collective Ownership**: Transition to DAO governance

### Technical Aspirations

- **Zero-Knowledge Proofs**: Full ZK implementation for privacy-preserving verification
- **Decentralized Identity**: Self-sovereign identity integration
- **Smart Contracts**: Blockchain-based governance for critical operations
- **AI Governance**: Enhanced Lindiwe capabilities with advanced ML models

### Community Growth

- **Geographic Expansion**: Starting in South Africa, expanding across Africa and beyond
- **Sector Integration**: Healthcare cooperatives, agricultural unions, artisan guilds
- **Institutional Partnerships**: Microfinance institutions, development banks, governments

---

## Troubleshooting

### Common Issues

#### Database Connection Errors

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
1. Check PostgreSQL is running: `pg_isready`
2. Verify DATABASE_URL in `.env.local`
3. Check firewall rules

#### Authentication Errors

```
Error: Clerk authentication failed
```

**Solution:**
1. Verify CLERK_SECRET_KEY is set correctly
2. Check Clerk dashboard for API key status
3. Ensure you're using the correct key (test vs live)

#### WebSocket Connection Failures

```
Error: WebSocket connection failed
```

**Solution:**
1. Check Socket.io server is running
2. Verify WebSocket URL configuration
3. Check for proxy/load balancer WebSocket support

#### Rate Limiting

```
Error: Too many requests
```

**Solution:**
1. Check Upstash Redis is connected
2. Verify rate limit configuration
3. Implement exponential backoff in client

#### Memory Issues

```
Error: JavaScript heap out of memory
```

**Solution:**
1. Increase Node.js memory limit: `NODE_OPTIONS='--max-old-space-size=4096' bun dev`
2. Optimize database queries
3. Add pagination to large result sets

### Debugging Tips

#### Enable Debug Logging

```bash
# Set debug environment variable
DEBUG=ubuntu-pools:* bun dev
```

#### Database Query Analysis

```typescript
// Enable query logging in development
import { db } from '@/db/client';

if (process.env.NODE_ENV === 'development') {
  db.$on('query', (query) => {
    console.log(query.sql, query.params);
  });
}
```

#### Performance Profiling

```typescript
// Add to critical functions
import { performance } from 'perf_hooks';

const start = performance.now();
await expensiveOperation();
console.log(`Operation took ${performance.now() - start}ms`);
```

### Getting Help

1. **Check Documentation**: Review relevant docs in `/docs`
2. **Run Diagnostics**: `bun run diagnostic`
3. **Contact Maintainers**: See CONTRIBUTING.md

---

## Contributing

We welcome contributions! Please see CONTRIBUTING.md for guidelines.

### Contribution Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and typecheck
5. Submit a pull request
6. Await code review

All contributors agree to the Governance Charter upon their first contribution.

---

## License

MIT License - See LICENSE file for details.

---

## Appendix: API Quick Reference

### Core Endpoints

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
| `/api/invites` | GET/POST | Invite chain |
| `/api/passport` | POST | Credential issuance |
| `/api/mirror` | GET | Village economic mirror |
| `/api/activity` | GET | Activity feed |
| `/api/reputation` | GET | Trust scores |

---

*Last Updated: March 2026*
*Version: 1.0.0*
*Built with Next.js 16, React 19, and the Ubuntu philosophy*
