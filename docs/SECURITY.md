# Security Policy — Ubuntu Pools

## Threat Model (STRIDE Analysis)

### Spoofing

| Threat | Severity | Mitigation |
|--------|----------|------------|
| Forged OpenClaw notifications | High | HMAC request signing on outbound gateway calls (`src/lib/integrations/openclaw/gateway.ts`) |
| Impersonated event actors | Medium | Event hash chain with SHA-256 prevents retroactive tampering (`src/lib/events/hasher.ts`) |
| API caller impersonation | Medium | Clerk authentication + RBAC authority levels (`src/lib/access/`) |

### Tampering

| Threat | Severity | Mitigation |
|--------|----------|------------|
| Event log mutation | Critical | Append-only event store with hash chain linkage (`src/lib/events/hasher.ts`, `src/lib/eventsourcing/core.ts`) |
| Ledger entry modification | Critical | Immutable journal entries with DB constraints; double-entry balance assertion (`src/lib/ledger/posting-engine.ts`) |
| Merkle root forgery | High | Periodic Merkle snapshots enable checkpoint verification (`src/lib/ledger/snapshot.ts`, `src/lib/ledger/merkle.ts`) |
| CI artifact tampering | Medium | Cosign signature on main branch pushes (`.github/workflows/audit.yml`) |

### Repudiation

| Threat | Severity | Mitigation |
|--------|----------|------------|
| Denied transactions | High | Every state change recorded as an immutable event with actor ID and timestamp |
| Governance decisions without audit trail | Medium | Backbone audit trail with full reasoning history (`src/lib/backbone/controller.ts`) |

### Information Disclosure

| Threat | Severity | Mitigation |
|--------|----------|------------|
| PII leakage in event payloads | High | PII linter in CI pipeline (`scripts/pii-linter.ts`); sovereignty proxy for profile sanitization (`src/lib/services/sovereignty-proxy.ts`) |
| Bank data exposure | High | Stitch integration uses token-based access; no raw credentials stored (`src/lib/integrations/stitch/`) |
| Game telemetry behavioural leakage | Medium | Derived signals only (no raw decisions stored); POPIA-compliant erasure via SovereigntyProxy (`src/lib/services/sovereignty-proxy.ts`, `src/lib/games/telemetry.ts`) |

### Denial of Service

| Threat | Severity | Mitigation |
|--------|----------|------------|
| Safety buffer depletion | High | Lindiwe AI autonomous mode escalation with dual-validation confirmation window (`src/lib/backbone/lindiwe.ts`) |
| Runaway emergency triggers | Medium | Confirmation delay before shield mode escalation prevents false triggers |

### Elevation of Privilege

| Threat | Severity | Mitigation |
|--------|----------|------------|
| Unauthorized pool access | High | Ubuntu Score thresholds enforced by backbone controller; emergency mode restricts to Elder threshold (850) (`src/lib/backbone/controller.ts`) |
| RBAC bypass | Medium | Permission guards with self-access, privilege, and ownership checks (`src/lib/access/`) |

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it responsibly by emailing the maintainers directly. Do not open a public issue.

## Continuous Verification

- **Hash chain verification** runs every 6 hours and on every push to main
- **Compliance gates** (typecheck, lint, tests, PII audit) run on all PRs
- **SBOM generation** tracks dependency supply chain
- **Cosign signing** provides artifact integrity on release
