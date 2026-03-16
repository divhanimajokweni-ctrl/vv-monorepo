# Ubuntu Pools — Phase 2: Non-Custodial Enforcement

## Overview

Phase 2 codifies the non-custodial posture in architecture, contracts, and UX affordances. The system never holds funds—it only records intent and authorization, delegating actual custody to external systems.

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        UBUNTU POOLS — PHASE 2                              │
│                    NON-CUSTODIAL INTENT FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

     ┌──────────┐     ┌──────────────┐     ┌─────────────────────┐
     │  Actor   │────▶│  Event       │────▶│  Posting Engine     │
     │(Member/  │     │  Service     │     │  (Phase 1)          │
     │ Custodian)     │              │     │                     │
     └──────────┘     └──────┬───────┘     └─────────────────────┘
                            │
                            ▼
                  ┌─────────────────┐
                  │  Intent Recorded│
                  │  (custody.intent)│
                  └────────┬────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │  Webhook   │  │  Multisig  │  │  Callback  │
    │  Adapter   │  │  Adapter   │  │  Adapter   │
    └─────┬──────┘  └─────┬──────┘  └─────┬──────┘
          │               │               │
          ▼               ▼               ▼
   ┌──────────────────────────────────────────────────┐
   │         EXTERNAL CUSTODY SYSTEM                   │
   │  (Multi-sig wallet / HSM / External Processor)  │
   │         FUNDS NEVER ENTER UBUNTU POOLS            │
   └──────────────────────────────────────────────────┘

KEY INVARIANT: Ubuntu Pools NEVER holds funds
- Intent records are PII-free (UUIDs only)
- All custody operations are external
- Signatures verified but not stored in ledger
```

## Intent Authorization Flow

```
1. Actor submits intent
   │
   ▼
2. EventService validates and records custody.intent_recorded
   │
   ▼
3. SignatureVerifier verifies external authorization
   │
   ▼
4. If verified: custody.authorization_signed event emitted
   │
   ▼
5. External custody adapter processes (webhook/callback)
   │
   ▼
6. Result recorded as event (no fund movement in Ubuntu Pools)
```

## Event Types

| Event Type | Purpose | PII-Free |
|------------|---------|----------|
| `custody.intent_recorded` | Records intent to act | ✅ |
| `custody.authorization_signed` | External signature verified | ✅ |
| `custody.external_custody_linked` | Adapter registered | ✅ |

## Signature Verification

All external signatures are verified server-side using deterministic algorithms:

- **Ed25519**: Elliptic curve (default)
- **Secp256k1**: Bitcoin-style signatures
- **RSA-4096**: Legacy support

Signatures are verified but never stored—only the verification result is recorded as an event.

## Non-Custodial Invariants

| Invariant | Description |
|-----------|-------------|
| **No fund storage** | System never stores value; ledger records intent only |
| **External custody** | All funds remain in external multi-sig/HSM |
| **PII-free events** | All events use UUIDs, no personal data |
| **Audit trail** | Every intent/authorization recorded as immutable event |
| **Deterministic verification** | Signature verification is deterministic and reproducible |

## Database Schema (Phase 2)

No new tables required for Phase 2—all data is stored as events in the existing `events` table.

## Compliance Notes

### POPIA/GDPR Compliance

- **Data Minimization**: Only intent metadata stored, no PII
- **Purpose Limitation**: Data used only for audit trails
- **Storage Limitation**: Events retained per retention policy
- **Accountability**: All actions traceable via hash chain

### Financial Regulations

- **Non-custodial**: System never holds client funds
- **Segregation**: External custody systems maintain fund control
- **Auditability**: Complete event history for regulatory review

## Testing

Run Phase 2 tests:

```bash
bun test src/tests/phase2-custody.test.ts
```

## Migration

No database migration required for Phase 2—all Phase 2 features use existing event infrastructure.

## Exit Criteria

| Criterion | Status |
|-----------|--------|
| Zero custody (no fund-holding) | ✅ |
| Intent traceable and auditable | ✅ |
| External signatures verified | ✅ |
| External signatures recorded | ✅ |
| 54+ tests passing | ✅ |
