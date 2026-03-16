# ADR-015: Crypto-Shredding Architecture for Right to be Forgotten

## Status

**Accepted** — Phase 5: Audit, Compliance, & Accountability

## Date

2026-02-27

## Context

The Ubuntu Pools Platform must comply with data protection regulations (GDPR/POPIA) that guarantee the Right to be Forgotten (RTBF). This requires the ability to effectively "shred" user personal data while maintaining the integrity of the immutable event ledger.

The challenge is reconciling two seemingly contradictory requirements:
1. **Immutability**: The event ledger must be append-only and cryptographically chained
2. **Data Deletion**: Personal data must be deletable upon user request

## Decision

We implement **crypto-shredding** (also known as cryptographic erasure) as the primary mechanism for RTBF compliance:

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CRYPTO-SHREDING ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────────────────────┐
│   User      │────▶│  Identity   │────▶│  Event Ledger               │
│   Data      │     │  Store      │     │  (Immutable, Hash-chained)  │
└─────────────┘     └──────┬──────┘     └──────────────┬──────────────┘
                           │                            │
                           ▼                            ▼
                    ┌─────────────┐            ┌─────────────────────┐
                    │  DEK Store  │            │  Encrypted Blobs    │
                    │  (per-user) │            │  (Event payloads)   │
                    └──────┬──────┘            └──────────┬────────────┘
                           │                               │
                           │        Key Hierarchy:        │
                           │                               │
                           │  ┌─────────┐                  │
                           │  │   KEK   │◀── Master key     │
                           │  └────┬────┘   (offline)      │
                           │       │                      │
                           │       ▼                      │
                           │  ┌─────────┐                │
                           └─▶│   DEK   │◀── Per-entity    │
                              └────┬────┘   Data Encrypt  │
                                   │                      │
                                   ▼                      │
                              ┌─────────┐                │
                              │  Blob   │◀── Encrypted    │
                              │  Data   │    with DEK      │
                              └─────────┘                │
                                                         │
                         Crypto-Shredding:               │
                         1. Delete DEK                   │
                         2. Data becomes unrecoverable  │
                         3. Ledger integrity preserved  │
```

### Implementation Details

1. **Key Hierarchy**
   - **KEK (Key Encryption Key)**: Master key, rotated manually via `scripts/rotate-kek.ts`
   - **DEK (Data Encryption Key)**: Per-entity keys encrypted with KEK
   - **Encrypted Blobs**: Event payload data encrypted with DEK

2. **Crypto-Shredding Process**
   ```
   RTBF Request Received
          │
          ▼
   Verify Legal Basis & Consent
          │
          ▼
   Locate all DEKs for user entity
          │
          ▼
   Delete DEKs (permanent removal)
          │
          ▼
   Create audit.incident_resolved event
          │
          ▼
   User data is cryptographically shredded
          │
          ▼
   Confirm deletion to data subject
   ```

3. **Compliance Metadata**
   - Every event includes `consent_version` and `legal_basis` in payload
   - RTBF requests are logged as governance events
   - Deletion confirmation includes cryptographic proof

### Consequences

**Positive:**
- Ledger immutability is preserved (no modifications to historical events)
- Full RTBF compliance without compromising audit integrity
- Cryptographic deletion provides strong evidentiary basis
- Key rotation supports long-term security

**Negative:**
- Once DEK is deleted, data is irrecoverable (by design for RTBF)
- Requires careful key management lifecycle
- Must maintain KEK for decrypting non-deleted historical data

## Alternatives Considered

1. **Soft Delete**: Mark records as deleted but retain data
   - Rejected: Does not satisfy true RTBF requirements

2. **Full Ledger Deletion**: Remove events entirely
   - Rejected: Destroys audit integrity and hash chain

3. **Separate PII Database**: Store PII separately from ledger
   - Rejected: Creates sync complexity and potential for inconsistency

## References

- [GDPR Article 17: Right to Erasure](https://gdpr-info.eu/art-17-gdpr/)
- [ISO/IEC 27040:2015 - Cryptographic Erasure](https://www.iso.org/standard/44404.html)
- `scripts/rotate-kek.ts` - KEK rotation utility
- `src/lib/events/schemas.ts` - Audit event schemas
