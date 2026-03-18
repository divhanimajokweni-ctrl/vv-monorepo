# Active Context: Ubuntu Pools — Phase 13 Complete

## Current State

**Phase 13 Status**: ✅ Complete — Trust Enhancement (Reputation Friction, Invite Chains, Portable Passports)

The Trust Enhancement phase adds mechanisms to prevent reputation inflation and enable portable economic credentials.

## Recently Completed

- [x] **CI Pipeline Fixes** (2026-03-18)
  - Installed missing lucide-react dependency
  - Fixed unescaped quotes in UbuntuDashboard.tsx for ESLint compliance
  - Resolved broken git submodule reference
  - Pushed fixes to enable successful Vercel deployments
- [x] **Phase 13: Trust Enhancement** (2026-03-13)
  - **Reputation Friction** (`src/lib/reputation/friction.ts`)
    - Time decay with 90-day half-life
    - Reputation age multiplier for longevity bonus
    - Diversity penalty for limited endorsement sources
    - Max 5% influence cap per user
    - Negative signal penalties for violations
    - Trust tier system (novice → archivist) with invite quotas
  - **Invite Chain** (`src/lib/services/invite-service.ts`, `src/db/schema-invite.ts`)
    - Tiered invites: Novice (2), Contributor (5), Steward (10), Archivist (unlimited)
    - Risk sharing: Inviters lose points if invitees commit fraud
    - Diversity requirements to prevent clique formation
    - Anchor invitations for community leaders
    - Network depth tracking
  - **Portable Economic Passport** (`src/lib/identity/passport.ts`)
    - Verifiable credentials with cryptographic proofs
    - Selective disclosure (score above X, no defaults, duration Y)
    - Base64 compact format for easy sharing
    - External verification for banks/employers/cooperatives
  - **Village Economic Mirror** (`src/lib/services/village-mirror.ts`)
    - Monthly buying power visualization
    - Village multiplier showing contribution leverage
    - Eligible opportunities based on score
    - Milestone tracking
  - **Living Village Loop** (`src/lib/services/activity-engine.ts`)
    - Event-based activity feed
    - Priority ranking (high/medium/low)
    - Impact narratives
    - Time-ago formatting
  - **Migration SQL** (`src/db/migrations/0004_trust_enhancement.sql`)

- [x] **CPME Implementation** (2026-03-13)
  - **CPME Schema** (`src/db/schema-cpme.ts`)
    - `procurement_circles` - Groups of villages forming buying collectives
    - `village_demands` - What villages want to buy collectively
    - `village_supplies` - What villages want to sell collectively  
    - `suppliers` - Registered suppliers with trust scores
    - `bids` - Supplier responses to demands
    - `contracts` - Agreements between villages and suppliers
    - `order_settlements` - Tracking delivery and payment
    - `village_entities` - Unified reference for villages across CPME
    - `cross_village_federations` - Federations for bulk coordination
    - `market_intelligence` - Aggregated demand/supply data for insights
  - **CPME Services** (`src/lib/market/index.ts`)
    - `DemandAggregationService` - Create/manage village buying demands
    - `SupplyAggregationService` - Create/manage village selling supplies
    - `SupplierMatchingService` - Register suppliers, match to demands, trust scoring
    - `ContractNegotiationService` - Submit bids, accept, create contracts
    - `OrderSettlementService` - Payment, shipping, delivery tracking
    - `ProcurementCircleService` - Create/join procurement circles
    - `MarketIntelligenceService` - Record/analyze market transactions
  - **API Routes** (`src/app/api/cpme/route.ts`)
    - Unified POST/GET endpoint for all CPME operations
  - **Migration SQL** (`src/db/migrations/0003_cpme.sql`)
    - All CPME tables with proper indexes
    - Helper functions: `calculate_coordination_fee()`, `adjust_supplier_trust()`, etc.

- [x] **Village OS Implementation** (2026-03-11)
  - **Village Schema** (`src/db/schema-village.ts`)
    - `villages` - Economic organizations with score, liquidity, settings
    - `village_members` - Members with roles (admin, treasurer, member), Ubuntu Score, reputation
    - `liquidity_pools` - ROSCA rotating savings pools with payout order
    - `pool_contributions` - Member contributions per cycle
    - `procurement_events` - Bulk purchasing events with negotiated savings
    - `procurement_participants` - Procurement event participants
    - `investments` - Village investments in local businesses
    - `investment_backers` - Investment backers with expected returns
    - `insurance_pools` - Community mutual insurance systems
    - `insurance_members` - Insurance pool members
    - `insurance_claims` - Insurance claims with approval workflow
    - `village_proposals` - Governance proposals with weighted voting
    - `village_votes` - Votes weighted by sqrt(Ubuntu Score)
    - `village_messages` - Encrypted village messaging channels
    - `village_relations` - Economic graph between villages
  - **Migration SQL** (`src/db/migrations/0002_village_os.sql`)
    - All enum types and tables with proper constraints
    - `calculate_village_score()` function - 0.4*AvgUserScore + 0.3*TxVolume + 0.2*PoolStability + 0.1*Governance
    - `calculate_governance_weight()` function - sqrt(Ubuntu Score) to prevent dominance
    - Views: `v_village_details`, `v_pool_member_contributions`
  - **Village Service** (`src/lib/services/village-service.ts`)
    - Create/list villages, join/leave
    - Create pools (savings, procurement, investment, insurance)
    - ROSCA cycle processing
    - Procurement event management
    - Investment backing
    - Insurance claims workflow
    - Proposal creation and voting
    - Village messaging
    - Village linking (economic graph)
    - Score calculation and updates
  - **API Routes** (`src/app/api/villages/`)
    - `POST/GET /api/villages` - Create and list villages
    - `GET /api/villages/[id]` - Get village details
    - `POST /api/villages/[id]/join` - Join a village
    - `GET/POST /api/villages/[id]/pools` - Pool management
    - `GET/POST /api/villages/[id]/proposals` - Governance proposals
    - `GET/POST /api/villages/[id]/messages` - Village messaging

- [x] **Social Networking Integration** (2026-03-08)
  - **Navigation Update** (`src/components/shell/AppShell.tsx`)
    - Added new nav items: Feed, Messages, Notifications, Search, Profile
    - Added SVG icons for each navigation item
    - Updated mobile responsive menu with icons
  - **Feed Page** (`src/app/page.tsx`)
    - Create post with content and media support
    - Posts with likes, comments, and bookmarks
    - User profiles with followers/following stats
    - Trending topics sidebar
    - Who to follow section
  - **Messages Page** (`src/app/messages/page.tsx`)
    - Conversation list with unread indicators
    - Real-time chat interface
    - Typing indicators
    - Online/offline status
  - **Notifications Page** (`src/app/notifications/page.tsx`)
    - Notification types: like, comment, follow, badge, mention, message
    - Mark as read functionality
    - Filter by all/unread
    - Notification settings
  - **Search Page** (`src/app/search/page.tsx`)
    - Search users and posts
    - Tab filtering: All, Users, Posts
    - Trending topics
    - User suggestions
  - **Profile Page** (`src/app/profile/page.tsx`)
    - User profile header with cover image
    - Posts, likes, media tabs
    - Followers/following modal
    - Badges display
    - Edit profile option
  - **Village Page Update** (`src/app/village/page.tsx`)
    - Added Feed and Members tabs to village
    - Social posts within village context
    - Member browsing with follow option
    - Combined social + fintech features

- [x] **Observability Infrastructure** (2026-03-07)
  - **Error Tracking** (`src/lib/observability/sentry.ts`)
    - Sentry integration with dynamic import (optional dependency)
    - Automatic error capturing with context
    - Event tracking (ledger_post_failed, shield_triggered, member_signup, loan_approved)
    - Set `NEXT_PUBLIC_SENTRY_DSN` to enable (free tier: 10k events/month)
  - **Structured Logging** (`src/lib/observability/logger.ts`)
    - Vercel-compatible JSON logging format
    - Log levels: debug, info, warn, error
    - Child loggers with contextual information
  - **Performance Monitoring** (`src/lib/observability/performance.ts`)
    - Web Vitals tracking (CLS, FID, FCP, LCP, TTFB)
    - Automatic rating (good/needs-improvement/poor)
    - Integrates with structured logger in production
  - **Feature Flags** (`src/lib/features/feature-flags.ts`)
    - Gradual rollout system with percentage-based bucketing
    - Allowlist/blocklist support for specific users
    - Flags: microcredit_enabled, advanced_analytics, prosperity_tiers_v2, lindiwe_learning
  - **Cache Engine** (`src/lib/cache/engine.ts`)
    - Redis support via Upstash (serverless-friendly)
    - In-memory fallback when Redis unavailable
    - Set `REDIS_URL` and `REDIS_TOKEN` to enable (free tier: 10k req/day)
  - **Enhanced Health Check** (`src/app/api/observability/health/route.ts`)
    - Database connection test with latency measurement
    - Cache status detection (redis/memory/none)
    - Memory usage monitoring
    - Returns 503 when critical
  - **Database Connection Pooling** (`src/db/client.ts`)
    - Optimized pool config for Vercel (20 connections) vs dedicated (10)
  - **Database Indexes** (`src/db/indexes.ts`)
    - SQL migrations for additional query optimization

- [x] **Code Consolidation** (2026-03-06)
  - **Service Bus** (`src/lib/services/service-bus.ts`)
    - Event subscription/emit pattern for loose coupling
    - Type-safe event handlers
    - Enables decoupling of OpenClaw, Lindiwe, Backbone
  - **API Helpers** (`src/lib/api/`)
    - `error-formatter.ts` - Consistent error responses
    - `route-handler.ts` - Decorator/wrapper for routes with auth, validation, rate limiting
    - Eliminates 50+ copy-paste validation patterns
  - **Access Control** (`src/lib/access/`)
    - `rbac.ts` - Unified AUTHORITY_LEVELS + privilege model (moved from reputation/)
    - `guards.ts` - Reusable authorization checks
    - `consent-manager.ts` - Privacy consent management (moved from privacy/)
    - Single export: `accessControl.check()`, `accessControl.checkConsent()`, `accessControl.isSelfAccess()`
  - **Eventsourcing** (`src/lib/eventsourcing/`)
    - `core.ts` - Unified event + ledger core logic
    - Re-exports from hasher and ledger queries for backward compatibility
    - Provides `EventSourcingCore` class combining hash verification + ledger queries
  - **Integrations** (`src/lib/integrations/`)
    - `openclaw/gateway.ts` - Dependency injection pattern (factory function)
    - `openclaw/event-handlers.ts` - Service bus subscriptions for OpenClaw notifications
    - `stitch/provider.ts` - Stitch integration with DI pattern
    - Single export point for all integrations

- [x] **Phase 9: Ubuntu Backbone Consolidation** (2026-03-05)
  - **Lindiwe AI** (`src/lib/backbone/lindiwe.ts`)
    - Village Pulse analysis (anxiety, excitement, stability)
    - Safety Buffer monitoring with autonomous reasoning
    - Transaction pattern behavioral scoring
    - Risk assessment (low/medium/high/critical)
    - Learning weights that self-improve
  - **Backbone Controller** (`src/lib/backbone/controller.ts`)
    - Central orchestrator connecting all three components
    - Stitch data sync to Ubuntu Score mapping
    - Autonomous threshold adjustment (Lindiwe controls Matchmaker)
    - Hard stop logic: Emergency mode when buffer < R 500
    - Audit trail for all self-regulation events
    - Member eligibility checking
  - **Village Status UI** (`src/components/backbone/VillageStatus.tsx`)
    - Real-time visualization of Lindiwe's governance
    - Shield Mode (protection) and Prosperity Mode (growth)
    - Compact and full view variants
    - Lindiwe's narrative reasoning display
    - Auto-refresh every 30 seconds
  - **API Routes** (`/api/backbone`):
    - `GET /api/backbone` - Get system state, config, audit trail
    - `POST /api/backbone` - Sync member data, regulate, update buffer
  - **Modes**: prosperity, expansion, stability, shield, emergency
  - Build: ✅ Zero TypeScript regressions

- [x] **Phase 7: Sovereignty & Matchmaker** (2026-03-02)
  - Sovereignty Proxy Service (`src/lib/services/sovereignty-proxy.ts`)
    - NER-based anonymization engine
    - Intent Tag extraction from social content
    - Profile types: blank, ESG-focused, Community Anchor, Entrepreneur, Mixed
    - TTL-based data ephemerality (default 30 days)
    - Category filtering: ESG, Community, Entrepreneur, Lifestyle
  - Matchmaker Service (`src/lib/services/matchmaker.ts`)
    - Signal-to-Asset algorithm
    - Pool recommendations based on intent tags
    - Social-Accord Synergy calculation
    - Combined Score: UbuntuScore × 0.65 + Synergy × 0.35
    - Personalized prosperity opportunities with discounted rates
  - UI Components (`src/components/sovereignty/`)
    - `SovereigntyToggle.tsx` - User-controlled data sharing switch
    - `MatchmakerCard.tsx` - Pool recommendation cards
    - `ProsperityOpportunityCard.tsx` - Personalized opportunity display
  - API Routes:
    - `POST/GET /api/sovereignty` - Toggle, configure, ingest, profile
    - `POST/GET /api/matchmaker/opportunity` - Generate prosperity opportunities
    - `POST/GET /api/matchmaker/recommendations` - Pool recommendations

- [x] **Phase 6.1: Ubuntu Score Implementation** (2026-03-02)
  - Ubuntu Score calculation in credit service (`src/lib/services/credit-service.ts`)
    - Member-level components: Coverage (35%), Timeliness (25%), Consistency (20%), Stress (20%)
    - Pool Health: Buffer Coverage Ratio + Default Rate → Pool Multiplier [0.75, 1.0]
    - Formula: `UbuntuScore = 100 * clamp(MemberCore * PoolMultiplier, 0, 1)`
    - Rolling window: configurable (default 90 days)
  - API Route: `POST/GET /api/credit/score` - Ubuntu Score calculation
  - Tests (7 new tests):
    - Perfect payment history → high score
    - Missed payments → stress penalty
    - Late payments → timeliness penalty
    - Pool health multiplier effect
    - Buffer strength impact

- [x] **Phase 6: Credit Facilities** (2026-03-02)
  - Credit database schema (`src/db/schema-credit.ts`)
    - `credit_pool_config` - Pool configuration and phase state
    - `member_credit_profile` - Member credit limits and history
    - `credit_loans` - Active loans with payment tracking
    - `credit_payments` - Payment records
    - `pool_health_history` - Historical health metrics
  - Credit service (`src/lib/services/credit-service.ts`)
    - Three-phase credit system with automatic transitions
    - Pool health calculation with liquidity/asset/profitability/growth scores
    - Credit eligibility checking with Ubuntu Score and contribution base
    - Loan approval with exposure limits
    - Payment processing and repayment tracking
  - Credit event schemas (`src/lib/events/schemas-credit.ts`)
    - `credit.pool_initialized`, `credit.capital_deposited`, `credit.phase_transition`
    - `credit.eligibility_checked`, `credit.loan_requested`, `credit.loan_approved`
    - `credit.loan_issued`, `credit.payment_received`, `credit.loan_repaid`
    - `credit.loan_defaulted`, `credit.health_updated`
  - API Routes:
    - `POST/GET /api/credit/pools` - Pool configuration
    - `POST /api/credit/eligibility` - Check credit eligibility
    - `POST/GET /api/credit/loans` - Loan management
    - `POST /api/credit/payments` - Process payments
    - `GET /api/credit/health` - Pool health metrics
  - UI Components:
    - `CreditDashboard.tsx` - Credit facilities dashboard with phase indicators
    - `PoolHealthGauge.tsx` - Visual pool health gauge with metrics
  - Tests (15 tests, 100% pass):
    - `src/tests/credit.test.ts` - Credit service unit tests

- [x] **Home Screen Redesign** (2026-03-01)
  - New humanistic UI with warm gradient background (`midnight` → `neutral-900` → `deep-forest`)
  - Added components:
    - `WelcomeDashboard.tsx` - Greeting, user stats (Ubuntu Score, Trust Circle, Contributions, Impact Points)
    - `VaultBalance.tsx` - Commons Vault balance display with progress bar
    - `ActivityFeed.tsx` - Recent community activities (contributions, badges, vouches, payments)
    - `QuickResources.tsx` - Billing, Docs, FICA Status, Platform Audit links
    - `FAQSection.tsx` - Expandable FAQ with categories (Philosophy & Trust, Payments & Liquidity, Security & Legal, Prosperity Tiers), AI Assistant CTA
    - `ProsperityTiers.tsx` - Family Wealth Reserve, SME Bulk-Buying Circle, Youth Unity Fund
    - `UserProfile.tsx` - Profile dropdown with settings, notifications, privacy controls
  - New CSS components: glass-card, warm-glow, humanistic-card, stat-card, activity-item, resource-link, faq-item, tier-card
  - New animations: float, breathe
  - New colors: sage, warm-cream, terracotta, deep-forest, sunset, midnight

- [x] **Phase 3 Implementation** (2026-02-27)
  - WebSocket server & client (`src/lib/websocket/`)
  - Trust-based reputation engine (`src/lib/reputation/engine.ts`)
  - Observability service (`src/lib/observability/service.ts`)
  - Data sovereignty/privacy framework (`src/lib/privacy/sovereignty.ts`)
  - Edge caching config (`src/lib/performance/edge.ts`)
  - UI Components:
    - `PulseVisualization.tsx` - Real-time collective pulses
    - `TrustConstellation.tsx` - Visual trust network
    - `ContributionResonance.tsx` - Impact multiplier visualization
    - `TimebankHarmony.tsx` - Mutual aid timebanking
    - `GovernanceHub.tsx` - Trust-based governance UI
    - `ObservabilityDashboard.tsx` - Community transparency
  - API Routes:
    - `/api/observability/health`
    - `/api/observability/metrics`
  - Tests (286 total, 100% pass):
    - `reputation.test.ts` - Trust score calculations
    - `observability.test.ts` - Transparency metrics
    - `privacy.test.ts` - Data sovereignty

- [x] **Phase 3 Technical Roadmap Document** (`docs/phase3-ubuntu-transformation.md`)
  - 12-week migration timeline with detailed deliverables
  - WebSocket architecture for real-time community feedback
  - Motion design specifications (trust flow animations, contribution ripples)
  - Trust score algorithm and authority levels
  - User-facing observability dashboard design
  - CI/CD pipeline (GitHub Actions with security scanning)
  - Edge-caching strategy for global <100ms TTFB
  - Privacy-first security framework (ZK proofs, data rights)

- [x] **5 Interactive Features for Collective Prosperity**
  1. Trust Constellation - visual web of trust relationships
  2. Contribution Resonance - ripple waves showing impact multiplier
  3. The Ubuntu Circle - collaborative task adoption system
  4. Timebank Harmony - mutual aid time-banking with circulation incentives
  5. Collective Achievement Constellation - community milestones over individual badges

- [x] **Trust-Based Governance Model**
  - Three-layer architecture: Constitutional, Operational, Arbitration
  - Trust circles as foundation (mutual vouching)
  - Council of Elders (elected arbitrators)
  - Archivist Council (protocol guardians)
  - Quadratic + conviction voting mechanisms
  - Dispute resolution flow (peer → mediation → elders → appeal)
  - Complete comparison: Traditional moderation vs trust-based governance

- [x] **Phase 4: Trust System** (previously completed)
  - Trust scores, decay, penalties, and appeals as gating mechanisms

- [x] PostgreSQL schema migration (`src/db/migrations/0001_phase1_foundation.sql`)
  - `events` table (append-only, immutability triggers)
  - `ledger_accounts` table (chart of accounts)
  - `journal_entries` table (double-entry, immutability triggers)
  - `posting_rules` table (event→ledger mapping config)
  - `v_account_balances` view
  - `v_transaction_balance_check` view
  - `assert_transaction_balanced()` DB function
  - Immutability triggers on all core tables
- [x] Drizzle ORM schema (`src/db/schema.ts`) — TypeScript representation
- [x] Database client (`src/db/client.ts`) — postgres.js + Drizzle
- [x] Event schemas & Zod validators (`src/lib/events/schemas.ts`)
  - Zod v4 compatible (uses `.issues`, `z.iso.datetime()`, `z.record(z.string(), z.unknown())`)
  - Phase 1 event types: system.initialized, ledger.account_opened, ledger.posting_rule_created, ledger.transaction_posted, ledger.transaction_failed
- [x] Deterministic event hasher (`src/lib/events/hasher.ts`)
  - SHA-256 over canonical JSON (sorted keys, snake_case fields)
  - Hash chain verification
- [x] Event emitter (`src/lib/events/emitter.ts`)
  - Append-only enforced
  - Idempotent (duplicate hash detection)
  - Atomic sequence number assignment
  - Status transitions: pending → posted | failed
- [x] Journal posting engine (`src/lib/ledger/posting-engine.ts`)
  - Double-entry balance assertion (app + DB level)
  - Payload extraction (dot-notation + JSONPath)
  - Account code template substitution
  - Audit events for success/failure
- [x] Ledger query utilities (`src/lib/ledger/queries.ts`)
  - Account balances (debit-normal / credit-normal)
  - Transaction history
  - Integrity checks (unbalanced transaction detection)
- [x] EventService (`src/lib/services/event-service.ts`)
- [x] LedgerService (`src/lib/services/ledger-service.ts`)
- [x] API routes:
  - `POST/GET /api/events`
  - `GET /api/events/[id]`
  - `POST/GET /api/ledger/accounts`
  - `GET /api/ledger/accounts/[id]/balance`
- [x] Test suite (130 tests, 100% pass rate)
  - `src/tests/hasher.test.ts` (39 tests)
  - `src/tests/schemas.test.ts` (49 tests)
  - `src/tests/posting-engine.test.ts` (42 tests)
- [x] Vitest configuration (`vitest.config.ts`)
- [x] Drizzle Kit configuration (`drizzle.config.ts`)

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/db/migrations/0001_phase1_foundation.sql` | PostgreSQL schema | ✅ Ready |
| `src/db/schema.ts` | Drizzle ORM schema | ✅ Ready |
| `src/db/schema-credit.ts` | Credit facilities schema | ✅ Ready |
| `src/db/client.ts` | DB connection | ✅ Ready |
| `src/lib/events/schemas.ts` | Zod validators | ✅ Ready |
| `src/lib/events/schemas-credit.ts` | Credit event schemas | ✅ Ready |
| `src/lib/events/hasher.ts` | SHA-256 hashing | ✅ Ready |
| `src/lib/events/emitter.ts` | Event emission | ✅ Ready |
| `src/lib/ledger/posting-engine.ts` | Double-entry posting | ✅ Ready |
| `src/lib/ledger/queries.ts` | Ledger queries | ✅ Ready |
| `src/lib/services/event-service.ts` | EventService | ✅ Ready |
| `src/lib/services/ledger-service.ts` | LedgerService | ✅ Ready |
| `src/lib/services/credit-service.ts` | CreditService | ✅ Ready |
| `src/lib/services/sovereignty-proxy.ts` | Sovereignty Proxy | ✅ Ready |
| `src/lib/services/matchmaker.ts` | Matchmaker Service | ✅ Ready |
| `src/app/api/events/route.ts` | Events API | ✅ Ready |
| `src/app/api/events/[id]/route.ts` | Single event API | ✅ Ready |
| `src/app/api/ledger/accounts/route.ts` | Accounts API | ✅ Ready |
| `src/app/api/ledger/accounts/[id]/balance/route.ts` | Balance API | ✅ Ready |
| `src/app/api/credit/pools/route.ts` | Credit pool API | ✅ Ready |
| `src/app/api/credit/eligibility/route.ts` | Credit eligibility API | ✅ Ready |
| `src/app/api/credit/loans/route.ts` | Loans API | ✅ Ready |
| `src/app/api/credit/payments/route.ts` | Payments API | ✅ Ready |
| `src/app/api/credit/health/route.ts` | Health API | ✅ Ready |
| `src/app/api/credit/score/route.ts` | Ubuntu Score API | ✅ Ready |
| `src/app/api/sovereignty/route.ts` | Sovereignty API | ✅ Ready |
| `src/app/api/matchmaker/route.ts` | Matchmaker API | ✅ Ready |
| `src/components/credit/CreditDashboard.tsx` | Credit dashboard UI | ✅ Ready |
| `src/components/credit/PoolHealthGauge.tsx` | Health gauge UI | ✅ Ready |
| `src/components/stitch/StitchLink.tsx` | Bank connection UI | ✅ Ready |
| `src/lib/bank-provider/types.ts` | Bank provider interfaces | ✅ Ready |
| `src/lib/bank-provider/stitch.ts` | Stitch implementation | ✅ Ready |
| `src/lib/bank-provider/index.ts` | Provider factory | ✅ Ready |
| `src/lib/backbone/lindiwe.ts` | Lindiwe AI reasoning engine | ✅ Ready |
| `src/lib/backbone/controller.ts` | Backbone controller | ✅ Ready |
| `src/lib/backbone/index.ts` | Backbone exports | ✅ Ready |
| `src/app/api/backbone/route.ts` | Backbone API | ✅ Ready |
| `src/components/backbone/VillageStatus.tsx` | Village Status UI | ✅ Ready |
| `src/lib/services/service-bus.ts` | Event bus for decoupling | ✅ Ready |
| `src/lib/api/` | API helpers (error-formatter, route-handler) | ✅ Ready |
| `src/lib/access/` | Unified RBAC + consent management | ✅ Ready |
| `src/lib/eventsourcing/` | Combined events + ledger core | ✅ Ready |
| `src/lib/integrations/` | OpenClaw, Stitch integrations with DI | ✅ Ready |
| `src/lib/observability/sentry.ts` | Sentry error tracking | ✅ Ready |
| `src/lib/observability/logger.ts` | Structured JSON logging | ✅ Ready |
| `src/lib/observability/performance.ts` | Web Vitals monitoring | ✅ Ready |
| `src/lib/observability/service.ts` | Transparency metrics service | ✅ Ready |
| `src/lib/observability/index.ts` | Observability exports | ✅ Ready |
| `src/lib/features/feature-flags.ts` | Feature flag system | ✅ Ready |
| `src/lib/cache/engine.ts` | Redis/in-memory cache | ✅ Ready |
| `src/db/indexes.ts` | Database index SQL | ✅ Ready |
| `src/tests/` | Unit tests (287 tests) | ✅ Ready |
| `src/app/page.tsx` | Feed page with posts, comments, likes | ✅ Ready |
| `src/app/messages/page.tsx` | Direct messaging page | ✅ Ready |
| `src/app/notifications/page.tsx` | Notifications page | ✅ Ready |
| `src/app/search/page.tsx` | Search users and posts | ✅ Ready |
| `src/app/profile/page.tsx` | User profile with followers/following | ✅ Ready |
| `src/app/village/page.tsx` | Reconfigured village with social features | ✅ Ready |
| `src/db/schema-village.ts` | Village OS schema | ✅ Ready |
| `src/db/migrations/0002_village_os.sql` | Village migration | ✅ Ready |
| `src/lib/services/village-service.ts` | Village business logic | ✅ Ready |
| `src/app/api/villages/route.ts` | Villages API | ✅ Ready |
| `src/app/api/villages/[id]/route.ts` | Single village API | ✅ Ready |
| `src/app/api/villages/[id]/join/route.ts` | Join village API | ✅ Ready |
| `src/app/api/villages/[id]/pools/route.ts` | Village pools API | ✅ Ready |
| `src/app/api/villages/[id]/proposals/route.ts` | Village proposals API | ✅ Ready |
| `src/app/api/villages/[id]/messages/route.ts` | Village messages API | ✅ Ready |
| `src/db/schema-cpme.ts` | CPME schema | ✅ Ready |
| `src/db/migrations/0003_cpme.sql` | CPME migration | ✅ Ready |
| `src/lib/market/index.ts` | CPME core services | ✅ Ready |
| `src/app/api/cpme/route.ts` | CPME API | ✅ Ready |

## Phase 1 + Phase 4 + Phase 6 Governance Compliance

| Requirement | Status |
|-------------|--------|
| Append-only event log | ✅ DB triggers prevent DELETE/UPDATE of core fields |
| Double-entry ledger | ✅ Balance asserted at app + DB level |
| Deterministic hashing | ✅ SHA-256 over canonical JSON (sorted keys) |
| Hash chain | ✅ prev_hash links events for tamper-evidence |
| Non-custodial | ✅ System records intent only, no fund custody |
| Integer minor units | ✅ All monetary values are bigint |
| Server-side validation | ✅ All inputs validated before DB write |
| Trust as Permissions | ✅ Trust scores gate proposals/operations (not balance math) |
| Trust Decay | ✅ Time-based decay with configurable rate |
| Trust Penalties | ✅ Infractions reduce score, emit events |
| Appeals Process | ✅ Recovery workflow with audit trail |
| Credit Phases | ✅ Three-phase rollout with buffer-first design |
| Pool Health Gates | ✅ Automatic credit freeze at health < 70% |
| Ubuntu Score Limits | ✅ Credit tied to contribution reliability |

## What's NOT Included (Future Phases)

- WebSocket server production deployment
- Full database integration for trust/reputation
- Real authentication system

## Setup Requirements

1. PostgreSQL database
2. `DATABASE_URL` environment variable
3. Run migrations in order:
   - `psql $DATABASE_URL < src/db/migrations/0001_phase1_foundation.sql`
   - `psql $DATABASE_URL < src/db/migrations/0002_village_os.sql`
   - `psql $DATABASE_URL < src/db/migrations/0003_cpme.sql`
   - `psql $DATABASE_URL < src/db/migrations/0004_trust_enhancement.sql`

## Session History

| Date | Changes |
|------|---------|
| 2026-03-18 | Fixed CI pipeline failures: installed lucide-react, escaped JSX quotes, removed broken submodule; pushed fixes for successful Vercel deployment |
| 2026-03-17 | Created extensive README.md with comprehensive documentation: conceptualization & philosophy, architecture overview, codebase structure, getting started, development guide, feature integration, testing, scaling strategies, deployment, future aspirations, and troubleshooting |
| 2026-03-13 | Phase 13 Trust Enhancement: Reputation friction (decay, diversity, max influence), Invite chains with guardrails, Portable economic passports, Village economic mirror, Living village activity loop |
| 2026-03-13 | Phase 12 CPME: Collective Procurement & Market Engine - demand/supply aggregation, supplier marketplace, contracts, procurement circles, market intelligence |
| Initial | Template created with base Next.js setup |
| 2026-02-26 | Phase 1 foundation implemented: event log, double-entry ledger, posting engine, 130 tests |
| 2026-02-27 | Phase 4 trust system: scores, decay, penalties, appeals, gating middleware |
| 2026-02-27 | Phase 3 transformation: technical roadmap, 5 prosperity features, trust-based governance model |
| 2026-03-01 | Home screen redesign: humanistic UI, Welcome Dashboard, Vault Balance, Activity Feed, Quick Resources, FAQ, Prosperity Tiers, User Profile |
| 2026-03-02 | Phase 6 credit facilities: phased credit system, Pool Health gates, Ubuntu Score limits, 15 tests |
| 2026-03-02 | Phase 6.1 Ubuntu Score: forward-looking trust score, Coverage/Timeliness/Consistency/Stress + Pool Multiplier, 22 tests |
| 2026-03-02 | Phase 7 Sovereignty & Matchmaker: NER anonymization, Sovereignty Toggle, TTL-based intent tags, Signal-to-Asset matching, 287 tests |
| 2026-03-05 | Phase 8 Plaid → Stitch Pivot: Adapter Pattern, Stitch integration, removed Plaid deps, zero regressions |
| 2026-03-05 | Phase 9 Ubuntu Backbone: Lindiwe AI + Ubuntu Score + Matchmaker consolidated, autonomous self-regulation, hard stops |
| 2026-03-06 | Code Consolidation: Service Bus, API Helpers, Access Control, Eventsourcing, Integrations modules |
| 2026-03-07 | Observability Infrastructure: Sentry error tracking, structured logging, Web Vitals monitoring, feature flags, Redis cache engine, enhanced health checks with DB connection test, connection pooling config |
| 2026-03-08 | Phase 10 Social Networking: Feed, Messages, Notifications, Search, Profile pages integrated with navigation, Village page reconfigured with social features |
| 2026-03-11 | Phase 11 Village OS: Programmable economic units with members, liquidity pools (ROSCA), bulk procurement, investments, insurance pools, governance with sqrt-weighted voting, encrypted messaging, economic graph linking |
