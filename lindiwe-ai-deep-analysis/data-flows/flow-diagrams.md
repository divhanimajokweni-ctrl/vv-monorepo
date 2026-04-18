# Data Flow Diagrams

## System-Level Data Flow Architecture

### Complete Ubuntu Pools Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL INPUTS                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │Bank APIs    │    │Game Clients │    │Admin Panel │             │
│  │(Stitch)     │    │(Web/Mobile) │    │(Dashboard) │             │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘             │
│         │                   │                   │                   │
└─────────┼───────────────────┼───────────────────┼──────────────────┘
          │                   │                   │
┌─────────▼───────────────────▼───────────────────▼──────────────────┐
│                       API GATEWAY LAYER                            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │/api/auth    │    │/api/games   │    │/api/admin   │             │
│  │JWT Tokens   │    │Sessions     │    │Controls     │             │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘             │
└─────────┼───────────────────┼───────────────────┼──────────────────┘
          │                   │                   │
┌─────────▼───────────────────▼───────────────────▼──────────────────┐
│                     BUSINESS LOGIC LAYER                           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │Auth Service │    │Game Engine  │    │Backbone     │             │
│  │             │    │             │    │Controller   │             │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘             │
└─────────┼───────────────────┼───────────────────┼──────────────────┘
          │                   │                   │
┌─────────▼───────────────────▼───────────────────▼──────────────────┐
│                       LINDIWE AI LAYER                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │Signal       │    │LindiweAI    │    │Telemetry    │             │
│  │Processor    │    │Engine       │    │System       │             │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘             │
│         │                   │                   │                   │
│         └───────────────────┼───────────────────┘                   │
│                             │                                       │
│  ┌──────────────────────────▼─────────────────────────────────────┐ │
│  │                    CREDIT INTELLIGENCE                         │ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │ │
│  │  │Risk Models  │    │Credit       │    │Behavioral   │         │ │
│  │  │             │    │Assessment   │    │Analysis     │         │ │
│  │  └─────────────┘    └─────────────┘    └─────────────┘         │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
          │                   │                   │
┌─────────▼───────────────────▼───────────────────▼──────────────────┐
│                      PERSISTENCE LAYER                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │PostgreSQL   │    │Redis Cache  │    │Event Store │             │
│  │Database     │    │             │    │            │             │
│  └─────────────┘    └─────────────┘    └─────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

## Lindiwe AI Internal Data Flow

### Regulatory Decision Flow

```
┌─────────────────┐
│   EXTERNAL      │
│   TRIGGERS      │
├─────────────────┤
│ • Buffer Health │
│ • Village Pulse │
│ • Pool Metrics  │
│ • Recent Events │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐     ┌─────────────────┐
│  INPUT          │────▶│  VALIDATION     │
│  SANITIZATION   │     │  & NORMALIZE    │
├─────────────────┤     ├─────────────────┤
│ • Range Checks  │     │ • Thresholds     │
│ • Type Safety   │     │ • Data Quality  │
│ • Null Handling │     │ • Schema Val.   │
└─────────┬───────┘     └─────────┬───────┘
          │                       │
          └───────────────────────┘
                    │
                    ▼
┌─────────────────┐     ┌─────────────────┐
│ DECISION TREE   │────▶│ CONFIDENCE      │
│ EVALUATION      │     │ SCORING         │
├─────────────────┤     ├─────────────────┤
│ • Emergency?    │     │ • 95% Emergency │
│ • Shield?       │     │ • 90% Shield    │
│ • Expand?       │     │ • 85% Expand    │
│ • Maintain?     │     │ • 80% Maintain  │
└─────────┬───────┘     └─────────┬───────┘
          │                       │
          └───────────────────────┘
                    │
                    ▼
┌─────────────────┐     ┌─────────────────┐
│ DUAL VALIDATION │────▶│ THRESHOLD       │
│ CHECK           │     │ ADJUSTMENT      │
├─────────────────┤     ├─────────────────┤
│ • First Signal? │     │ • Emergency:    │
│ • Confirm Window│     │   +150 pts      │
│ • Escalation?   │     │ • Shield: +75   │
│ • Reset?        │     │ • Expand: -50   │
└─────────┬───────┘     └─────────┬───────┘
          │                       │
          └───────────────────────┘
                    │
                    ▼
┌─────────────────┐     ┌─────────────────┐
│ AUDIT LOGGING   │────▶│ EXPLANATION     │
│ & PERSISTENCE   │     │ GENERATION      │
├─────────────────┤     ├─────────────────┤
│ • Immutable Log │     │ • Human Readable│
│ • Event Stream  │     │ • POPIA Comp.   │
│ • Rollback Cap. │     │ • Transparency  │
└─────────┬───────┘     └─────────┬───────┘
          │                       │
          └───────────────────────┘
                    │
                    ▼
┌─────────────────┐
│   OUTPUT        │
│   DECISIONS     │
├─────────────────┤
│ • Action Type   │
│ • Threshold Δ   │
│ • Confidence %  │
│ • Risk Flags    │
│ • Explanation   │
└─────────────────┘
```

## Game Telemetry Data Flow

### Signal Extraction Pipeline

```
┌─────────────────┐
│   GAME SESSION  │
│   COMPLETION    │
├─────────────────┤
│ • Final State   │
│ • Decision Log  │
│ • Score/Outcome │
│ • Duration      │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐     ┌─────────────────┐
│  CONSENT CHECK  │────▶│  SIGNAL         │
│                 │     │  EXTRACTION     │
├─────────────────┤     ├─────────────────┤
│ • User Consent  │     │ • Per-Game       │
│ • Data Rights   │     │   Extractors     │
│ • POPIA Comp.   │     │ • Confidence     │
│ • Erasure Cap.  │     │   Scoring        │
└─────────┬───────┘     └─────────┬───────┘
          │                       │
          │                       ▼
          │            ┌─────────────────┐
          │            │  SIGNAL         │
          │            │  VALIDATION     │
          │            ├─────────────────┤
          │            │ • Range Checks  │
          │            │ • Type Safety   │
          │            │ • Rationale Req │
          │            └─────────┬───────┘
          │                      │
          └──────────────────────┘
                    │
                    ▼
┌─────────────────┐     ┌─────────────────┐
│  AGGREGATION    │────▶│  BACKBONE       │
│  & ENRICHMENT   │     │  INTEGRATION    │
├─────────────────┤     ├─────────────────┤
│ • Session Avg.  │     │ • Game Signals  │
│ • Confidence Wt.│     │ • Member Update │
│ • Multi-Session │     │ • Credit Boost  │
│ • Trend Analysis│     │ • Ubuntu Score  │
└─────────┬───────┘     └─────────┬───────┘
          │                       │
          └───────────────────────┘
                    │
                    ▼
┌─────────────────┐     ┌─────────────────┐
│  CREDIT         │────▶│  STORAGE        │
│  INTELLIGENCE   │     │  & RETENTION    │
├─────────────────┤     ├─────────────────┤
│ • Risk Tier     │     │ • PostgreSQL    │
│ • Credit Limit  │     │ • Sovereignty   │
│ • Product Rec.  │     │ • Erasable      │
│ • Explainability│     │ • Audit Trail   │
└─────────┬───────┘     └─────────┬───────┘
          │                       │
          └───────────────────────┘
                    │
                    ▼
┌─────────────────┐
│   MEMBER        │
│   DASHBOARD     │
├─────────────────┤
│ • Credit Offers │
│ • Risk Insights │
│ • Game Impact   │
│ • Transparency  │
└─────────────────┘
```

## Signal Processing Pipeline

### Real-Time Signal Flow

```
┌─────────────────┐
│  GAME EVENT     │
│  (Real-Time)    │
├─────────────────┤
│ • Player Action │
│ • Decision Made │
│ • Outcome       │
│ • Timestamp     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐     ┌─────────────────┐
│   SIGNAL        │────▶│   ENRICHMENT    │
│   INGESTION     │     │                 │
├─────────────────┤     ├─────────────────┤
│ • Raw Events    │     │ • Impulse Vec.  │
│ • User ID       │     │ • Community FP  │
│ • Game Context  │     │ • Timestamp     │
│ • Consent       │     │ • Metadata      │
└─────────┬───────┘     └─────────┬───────┘
          │                       │
          └───────────────────────┘
                    │
                    ▼
┌─────────────────┐     ┌─────────────────┐
│   BUFFERING     │────▶│   BATCH         │
│   & QUEUING     │     │   PROCESSING    │
├─────────────────┤     ├─────────────────┤
│ • Rolling Buffer│     │ • Every 100     │
│ • Memory Mgmt   │     │   Signals       │
│ • Overflow Prot.│     │ • Mini-Batch    │
│ • Priority Q    │     │ • Async Proc.   │
└─────────┬───────┘     └─────────┬───────┘
          │                       │
          └───────────────────────┘
                    │
                    ▼
┌─────────────────┐     ┌─────────────────┐
│  ONLINE LEARNING│────▶│  MODEL UPDATE   │
│                 │     │                 │
├─────────────────┤     ├─────────────────┤
│ • Parameter Adj.│     │ • Gradient Upd. │
│ • Weight Tuning │     │ • Distributed   │
│ • A/B Testing   │     │ • Version Ctrl  │
│ • Rollback Cap. │     │ • Performance   │
└─────────┬───────┘     └─────────┬───────┘
          │                       │
          └───────────────────────┘
                    │
                    ▼
┌─────────────────┐     ┌─────────────────┐
│ DOWNSTREAM      │────▶│  LEADERBOARD    │
│ INTEGRATION     │     │  UPDATES        │
├─────────────────┤     ├─────────────────┤
│ • Tournament    │     │ • Real-Time     │
│   Triggers      │     │   Rankings      │
│ • Credit Models │     │ • Skill Ratings │
│ • Community     │     │ • Matchmaking   │
│   Insights      │     │ • Fair Play     │
└─────────┬───────┘     └─────────┬───────┘
          │                       │
          └───────────────────────┘
                    │
                    ▼
┌─────────────────┐
│   EVENT         │
│   EMISSION      │
├─────────────────┤
│ • Platform Evt. │
│ • Webhook Notif.│
│ • Audit Trail   │
│ • Analytics     │
└─────────────────┘
```

## Data Movement Patterns

### Sovereignty Proxy Data Flow

```
┌─────────────────┐
│   MEMBER        │
│   REQUESTS      │
├─────────────────┤
│ • Data Erasure  │
│ • Consent Update│
│ • Access Rights │
│ • Privacy Ctrl  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐     ┌─────────────────┐
│   CONSENT       │────▶│   VALIDATION    │
│   VERIFICATION  │     │                 │
├─────────────────┤     ├─────────────────┤
│ • Identity Ver. │     │ • Request Auth. │
│ • Consent Log   │     │ • Scope Limits  │
│ • Timestamp     │     │ • Rate Limiting │
│ • Audit Trail   │     │ • Fraud Detect  │
└─────────┬───────┘     └─────────┬───────┘
          │                       │
          └───────────────────────┘
                    │
                    ▼
┌─────────────────┐     ┌─────────────────┐
│   DATA LOCATION │────▶│   CASCADE       │
│   DISCOVERY     │     │   DELETION      │
├─────────────────┤     ├─────────────────┤
│ • Database Scan │     │ • Foreign Keys  │
│ • Cache Inval.  │     │ • Event Streams │
│ • Backup Files  │     │ • Derived Data  │
│ • Analytics     │     │ • Aggregates    │
└─────────┬───────┘     └─────────┬───────┘
          │                       │
          └───────────────────────┘
                    │
                    ▼
┌─────────────────┐     ┌─────────────────┐
│   VERIFICATION  │────▶│   CONFIRMATION  │
│   & CLEANUP     │     │                 │
├─────────────────┤     ├─────────────────┤
│ • Zero Check    │     │ • Member Notify │
│ • Integrity Ver.│     │ • Audit Log     │
│ • Rollback Cap. │     │ • Receipt       │
│ • Data Vacuum   │     │ • Transparency  │
└─────────┬───────┘     └─────────┬───────┘
          │                       │
          └───────────────────────┘
                    │
                    ▼
┌─────────────────┐
│   IRREVERSIBLE  │
│   ERASURE       │
├─────────────────┤
│ • Complete Data │
│ • Derived Signal│
│ • Historical    │
│ • Future Data   │
└─────────────────┘
```

## Performance Data Flows

### Caching Strategy Flow

```
┌─────────────────┐
│   REQUEST       │
│   INCOMING      │
├─────────────────┤
│ • API Call      │
│ • User Context  │
│ • Cache Key     │
│ • Freshness Req │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐     ┌─────────────────┐
│   L1 CACHE      │────▶│   L2 CACHE      │
│   (Redis Local) │     │   (Redis Cluster)│
├─────────────────┤     ├─────────────────┤
│ • Hot Data      │     │ • Warm Data     │
│ • User Session  │     │ • Shared State  │
│ • 1ms Access    │     │ • 5ms Access    │
│ • Local Node    │     │ • Cross-Region  │
└─────────┬───────┘     └─────────┬───────┘
          │                       │
          │                       ▼
          │            ┌─────────────────┐
          │            │   CACHE MISS    │
          │            │   HANDLING      │
          │            ├─────────────────┤
          │            │ • Database      │
          │            │   Query         │
          │            │ • Computation   │
          │            │ • API Call      │
          │            └─────────┬───────┘
          │                      │
          └──────────────────────┘
                    │
                    ▼
┌─────────────────┐     ┌─────────────────┐
│   RESPONSE      │────▶│   CACHE WRITE   │
│   GENERATION    │     │   BACK          │
├─────────────────┤     ├─────────────────┤
│ • Data Format   │     │ • Multi-Level   │
│ • Compression   │     │ • TTL Setting   │
│ • Serialization │     │ • Invalidation  │
│ • ETag Headers  │     │ • Consistency   │
└─────────┬───────┘     └─────────┬───────┘
          │                       │
          └───────────────────────┘
                    │
                    ▼
┌─────────────────┐
│   CLIENT        │
│   RESPONSE      │
├─────────────────┤
│ • Cached Data   │
│ • Freshness Ind │
│ • Performance   │
│ • Cost Savings  │
└─────────────────┘
```

These data flow diagrams illustrate the sophisticated information pathways that enable Lindiwe AI to provide autonomous governance while maintaining data sovereignty, performance, and ethical standards.