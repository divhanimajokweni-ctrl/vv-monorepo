# ADR-016: PII-Free Event Architecture

## Status

**Accepted** — Phase 5: Audit, Compliance, & Accountability

## Date

2026-02-27

## Context

The Ubuntu Pools Platform event ledger is designed to be publicly readable and cryptographically verifiable. To protect user privacy while maintaining full audit capability, all events in the public ledger must be free of Personally Identifiable Information (PII).

This architecture ensures:
- Privacy by design (GDPR Article 25)
- Data minimization (GDPR Article 5(1)(c))
- Public transparency without exposing personal data

## Decision

### Core Principle

**The event ledger stores only pseudonymous identifiers (UUIDs). All PII is confined to the Identity Module, which is separately encrypted and access-controlled.**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PII-FREE EVENT ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐     ┌───────────────────┐     ┌─────────────────────┐
│   User/Entity    │────▶│   Identity        │     │   Event Ledger     │
│   (Real World)   │     │   Module          │     │   (Public, PII-Free)│
└──────────────────┘     └─────────┬─────────┘     └──────────┬──────────┘
                                   │                         │
                          ┌────────┴────────┐                │
                          │  Encrypted     │                │
                          │  PII Store     │                │
                          │  (Restricted)  │                │
                          └────────────────┘                │
                                   │                         │
                          ┌────────▼────────┐                │
                          │  Mapping:       │                │
                          │  UUID ⇔ PII    │                │
                          └─────────────────┘                │
                                   │                         │
                    ┌───────────────┼───────────────┐        │
                    ▼               ▼               ▼        ▼
             ┌──────────┐    ┌──────────┐    ┌──────────┐ ┌──────────┐
             │  Actor   │    │  Entity  │    │  Entity  │ │  Entity  │
             │  (UUID)  │    │  (UUID)  │    │  (UUID)  │ │  (UUID)  │
             └──────────┘    └──────────┘    └──────────┘ └──────────┘

             EVENT LEDGER CONTENTS (Pseudonymous Only):
             - event_id: UUID
             - actor_id: UUID (no name/email)
             - entity_id: UUID (no name/identifier)
             - entity_type: string (pool, member, etc.)
             - payload: PII-free data only
             - hash: SHA-256
             - prev_hash: SHA-256
```

### Implementation

1. **Event Schema Constraints**
   - All identifiers use UUID v4 format (defined in `src/lib/events/schemas.ts`)
   - No string identifiers that could reveal identity (names, emails, addresses)
   - Payload fields are strictly typed and validated via Zod

2. **PII Boundary**
   ```
   ┌─────────────────────────────────────────────────────────────────┐
   │                        PII BOUNDARY                            │
   └─────────────────────────────────────────────────────────────────┘
   
   ┌──────────────────────────────────┐   ┌────────────────────────┐
   │   IDENTITY MODULE (Private)      │   │  EVENT LEDGER (Public) │
   │                                  │   │                        │
   │  - User real names               │   │  - UUID identifiers    │
   │  - Email addresses               │   │  - Transaction amounts │
   │  - Physical addresses            │   │  - Event timestamps    │
   │  - KYC documents                │   │  - Entity types        │
   │  - Contact information           │   │  - Hash chain          │
   │  - Biometric data               │   │                        │
   │                                  │   │                        │
   │  Access: Restricted to           │   │  Access: Anyone        │
   │  authorized identity service     │   │  (read-only, verified)│
   └──────────────────────────────────┘   └────────────────────────┘
   ```

3. **Consent Tracking**
   Every event includes compliance metadata:
   ```typescript
   // In event payload schema
   {
     consent_version: string;    // e.g., "1.0"
     legal_basis: enum;          // "consent", "legitimate_interest", "legal_obligation"
     purpose: string;            // e.g., "governance_vote", "treasury_allocation"
   }
   ```

4. **PII Linter (CI Gate)**
   A pre-commit and CI check scans event payloads:
   - Regex patterns for common PII (emails, phone numbers, SSNs)
   - Zod schema validation enforces type safety
   - Fails build if PII patterns detected

### Allowed vs. Prohibited

| Category | Allowed | Prohibited |
|----------|---------|------------|
| Identifiers | UUIDs, entity codes | Names, emails, addresses |
| Amounts | Numeric values | Currency symbols with names |
| Timestamps | ISO 8601 UTC | Localized date formats with timezone names |
| References | UUID references | URLs to private resources |
| Metadata | Purpose, legal basis | Personal descriptions |

### Consequences

**Positive:**
- Public ledger can be shared without privacy concerns
- Simplified compliance with data protection regulations
- Cryptographic verification doesn't require PII
- Audit trail works without exposing identity

**Negative:**
- Requires separate Identity Module for PII management
- More complex architecture (two data stores)
- Must maintain UUID mapping integrity

## Alternatives Considered

1. **On-Chain Encryption**: Encrypt all PII in the ledger
   - Rejected: Complexity, key management, still accessible to chain observers

2. **Opt-In Pseudonymization**: Allow users to choose
   - Rejected: Inconsistent privacy protection

3. **Hash Identifiers**: Replace UUIDs with salted hashes
   - Rejected: Rainbow table attacks possible, collisions

## References

- [GDPR Article 5: Principles relating to processing](https://gdpr-info.eu/art-5-gdpr/)
- [NIST SP 800-122: Guide to Protecting PII](https://csrc.nist.gov/publications/detail/sp/800-122/final)
- `src/lib/events/schemas.ts` - Zod schemas with UUID validation
- `.github/workflows/audit.yml` - PII linting CI gate
- `src/lib/identity/` - Identity Module (restricted)
