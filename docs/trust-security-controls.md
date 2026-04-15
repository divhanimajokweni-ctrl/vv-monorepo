# Trust & Security Controls — Ubuntu Pools

> *"I am because we are"* — A security control inventory for collective trust, governance integrity, and compliance.

---

## Overview

The Trust & Security Controls module provides a comprehensive security control inventory for the Ubuntu Pools platform. It enables tracking, assessment, and continuous improvement of security controls across five categories:

- **Infrastructure Security** — Network, keys, backups, runtime
- **Organizational Security** — Access, training, incidents, vendors
- **Product Security** — Auth, authorization, validation, anti-abuse
- **Internal Procedures** — SDLC, testing, logging
- **Data & Privacy** — Rights, consent, POPIA compliance

This system aligns with industry frameworks:
- **OWASP ASVS 4.0** — Application Security Verification Standard
- **NIST SSDF 1.1** — Secure Software Development Framework
- **POPIA 2021** — Protection of Personal Information Act (South Africa)
- **ISO 27001:2022** — Information Security Management

---

## Quick Start

### Prerequisites

- Node.js 18+
- Bun (recommended) or npm/yarn
- PostgreSQL database
- All previous migrations applied (0001–0004)

### Install & Migrate

```bash
# Install dependencies
bun install

# Run the security controls migration
psql $DATABASE_URL < src/db/migrations/0005_security_controls.sql

# Verify migration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM security_controls;"

# Run development server
bun dev
```

---

## Security Controls Inventory

### Control Categories

| Category | Code Prefix | Description |
|----------|-------------|-------------|
| Infrastructure | INF-## | Network, keys, backups, runtime |
| Organizational | ORG-## | Access, training, incidents, vendors |
| Product | PROD-## | Auth, validation, anti-abuse |
| Internal Procedures | PROC-## | SDLC, testing, logging |
| Data & Privacy | DATA-## | Rights, consent, POPIA |

### Current Controls (22 Total)

#### Infrastructure (6 controls)
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| INF-01 | Network Segmentation | partial | critical |
| INF-02 | Secure Secret Storage | partial | critical |
| INF-03 | Key Rotation | missing | high |
| INF-04 | Backup and DR | missing | critical |
| INF-05 | WebSocket Authentication | partial | high |
| INF-06 | Rate Limiting | partial | high |

#### Organizational (5 controls)
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| ORG-01 | RBAC Implementation | implemented | critical |
| ORG-02 | Founder Override Controls | partial | critical |
| ORG-03 | Incident Response | missing | critical |
| ORG-04 | Vendor Risk | missing | high |
| ORG-05 | Security Training | missing | medium |

#### Product (7 controls)
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| PROD-01 | Immutable Ledger | implemented | critical |
| PROD-02 | Double-Entry Bookkeeping | implemented | critical |
| PROD-03 | Reputation Anti-Inflation | implemented | high |
| PROD-04 | Sybil Defense | implemented | critical |
| PROD-05 | Governance Rules | implemented | critical |
| PROD-06 | Credit Pool Health | implemented | critical |
| PROD-07 | Fraud Detection | implemented | high |

#### Internal Procedures (5 controls)
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| PROC-01 | Secure SDLC | partial | critical |
| PROC-02 | Dependency Scanning | partial | high |
| PROC-03 | Secrets Scanning | missing | critical |
| PROC-04 | Security Logging | partial | high |
| PROC-05 | Abuse Testing | missing | high |

#### Data & Privacy (6 controls)
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| DATA-01 | Data Export | implemented | critical |
| DATA-02 | Right to Deletion | implemented | critical |
| DATA-03 | Selective Disclosure | implemented | high |
| DATA-04 | Consent Management | implemented | critical |
| DATA-05 | ZK Proofs | implemented | high |
| DATA-06 | POPIA DSAR | missing | critical |

---

## API Endpoints

### Controls

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/security/controls` | GET | List all controls with optional filters |
| `/api/security/controls` | POST | Create new control |
| `/api/security/controls/summary` | GET | Get maturity score and summary |
| `/api/security/controls/[id]` | GET | Get individual control |
| `/api/security/controls/[id]` | PATCH | Update control (including status) |
| `/api/security/controls/[id]` | DELETE | Delete control |
| `/api/security/controls/[id]/evidence` | GET | Get evidence for control |
| `/api/security/controls/[id]/evidence` | POST | Add evidence to control |

### Incidents

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/security/incidents` | GET | List all incidents |
| `/api/security/incidents` | POST | Create new incident |
| `/api/security/incidents/[id]` | GET | Get individual incident |
| `/api/security/incidents/[id]` | PATCH | Update incident status |

### Query Parameters

```
GET /api/security/controls?category=INFRASTRUCTURE&status=missing&priority=critical
GET /api/security/controls?search=network
GET /api/security/controls?framework=OWASP
GET /api/security/controls/summary?type=summary
GET /api/security/controls/summary?type=gaps
GET /api/security/incidents?severity=high&status=open
```

---

## Usage Examples

### Get Control Summary

```bash
curl http://localhost:3000/api/security/controls/summary
```

Response:
```json
{
  "total": 22,
  "implemented": 9,
  "partial": 7,
  "missing": 6,
  "maturityScore": 41,
  "byCategory": {
    "INFRASTRUCTURE": { "implemented": 0, "partial": 4, "missing": 2 },
    ...
  }
}
```

### Update Control Status

```bash
curl -X PATCH http://localhost:3000/api/security/controls/[id] \
  -H "Content-Type: application/json" \
  -d '{"status": "implemented", "assessorId": "uuid", "notes": "Network segmentation configured"}'
```

### Create Security Incident

```bash
curl -X POST http://localhost:3000/api/security/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Unauthorized access attempt",
    "description": "Detected multiple failed login attempts",
    "severity": "high",
    "affectedSystems": ["auth-service"],
    "affectedControls": ["ORG-01"]
  }'
```

### Add Evidence

```bash
curl -X POST http://localhost:3000/api/security/controls/[id]/evidence \
  -H "Content-Type: application/json" \
  -d '{
    "evidenceType": "screenshot",
    "title": "Firewall configuration",
    "description": "AWS security group rules",
    "evidenceUrl": "https://..."
  }'
```

---

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `security_controls` | Main control register |
| `control_evidence` | Evidence artifacts for controls |
| `control_assessments` | Assessment history and status changes |
| `security_incidents` | Incident tracking |
| `control_frameworks` | Reference frameworks (OWASP, NIST, POPIA, ISO) |

### Key Fields

**security_controls:**
- `control_id` — Unique identifier (e.g., INF-01)
- `category` — INFRASTRUCTURE, ORGANIZATIONAL, PRODUCT, INTERNAL_PROCEDURES, DATA_PRIVACY
- `status` — implemented, partial, missing, not_applicable
- `priority` — critical, high, medium, low
- `risk_level` — critical, high, medium, low
- `framework_references` — JSON array of framework references
- `recommendation` — Remediation guidance

---

## Development Commands

```bash
# Install dependencies (auto-fixes known vulnerabilities)
bun install

# Run security audit
bun audit
bun audit:fix  # semver-safe updates
bun update     # semver-safe updates

# Run migrations
psql $DATABASE_URL < src/db/migrations/0005_security_controls.sql

# Run tests
bun test
bun test:watch
bun test:coverage

# Type check & lint
bun typecheck
bun lint

# Development server
bun dev
```

---

## Scaling Roadmap

### Phase 1: Foundation (Current)
- [x] Database schema and migrations
- [x] 22 seeded controls
- [x] Basic CRUD operations
- [x] Maturity score calculation

### Phase 2: Evidence & Assessment
- [ ] Evidence upload and verification workflow
- [ ] Assessment scheduling and reminders
- [ ] Automated control testing
- [ ] Integration with observability stack

### Phase 3: Automation
- [ ] CI/CD integration for control verification
- [ ] Automated security scanning
- [ ] Real-time compliance dashboards
- [ ] Incident response automation

### Phase 4: Advanced
- [ ] Risk scoring and threat modeling
- [ ] Penetration testing integration
- [ ] Compliance reporting (SOC 2, ISO 27001)
- [ ] Automated remediation workflows

---

## Framework Mappings

### OWASP ASVS 4.0

| Control | ASVS Requirement |
|---------|------------------|
| INF-01 | 1.2 — Application Architecture |
| INF-02 | 2.10 — Credential Storage |
| INF-05 | 2.2 — Session Management |
| PROD-01 | 7.7 — Cryptographic Architecture |
| PROD-02 | 7.6 — Financial Transactions |
| DATA-01 | 1.4 — Access Control |
| DATA-04 | 1.4 — Consent Management |

### NIST SSDF

| Control | SSDF Practice |
|---------|---------------|
| INF-03 | SC.3 — Key Management |
| INF-04 | SC.4 — Recovery Procedures |
| PROC-01 | SC.1 — Secure Development |
| PROC-02 | SC.3 — Supply Chain Security |
| PROC-05 | ST.2 — Security Testing |

### POPIA

| Control | POPIA Article |
|---------|---------------|
| DATA-01 | Art 14 — Right to Access |
| DATA-02 | Art 17 — Right to Erasure |
| DATA-04 | Art 18 — Consent |
| DATA-06 | Art 14-22 — Data Subject Rights |

---

## File Structure

```
src/
├── db/
│   ├── migrations/
│   │   └── 0005_security_controls.sql
│   └── schema-security-controls.ts
├── lib/
│   └── services/
│       └── security-controls-service.ts
├── app/
│   └── api/
│       └── security/
│           ├── controls/
│           │   ├── route.ts
│           │   ├── summary/
│           │   │   └── route.ts
│           │   └── [id]/
│           │       ├── route.ts
│           │       └── evidence/
│           │           └── route.ts
│           └── incidents/
│               ├── route.ts
│               └── [id]/
│                   └── route.ts
└── components/
    └── dashboard/
        └── SecurityControlsDashboard.tsx
```

---

## Best Practices

### Control Management

1. **Regular Reviews** — Review critical controls monthly, others quarterly
2. **Evidence Quality** — Include diverse evidence types (documents, screenshots, logs)
3. **Status Changes** — Always include assessor ID and notes when changing status
4. **Gap Tracking** — Prioritize remediation of critical/high gaps

### Incident Response

1. **Quick Triage** — Set severity within 24 hours of detection
2. **Root Cause** — Document affected controls and systems
3. **Closure** — Include resolution notes before closing
4. **Lessons Learned** — Use incidents to improve controls

### Compliance

1. **Framework Alignment** — Map controls to external frameworks
2. **Audit Trail** — Maintain assessment history
3. **Expiration** — Set evidence expiration dates for time-sensitive artifacts
4. **Ownership** — Assign owners to all controls

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run migrations and tests
4. Add new controls following the established pattern
5. Update documentation
6. Submit a pull request

---

## License

MIT
