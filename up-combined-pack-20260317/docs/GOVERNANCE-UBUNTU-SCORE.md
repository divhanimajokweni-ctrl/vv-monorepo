# Ubuntu Score — Governance & Developer Reference

> **"I am because we are."** The Ubuntu Score is a measure of community contribution,
> not capital. It rewards those who uplift the Village Pool.

## Scoring Pillars

| Pillar         | Weight | Metric                                              |
|----------------|--------|-----------------------------------------------------|
| Consistency    | 40%    | On-time contributions to the Village Pool           |
| Reciprocity    | 30%    | Peer-to-peer support (capped at 10 assists/period)  |
| Utilization    | 20%    | Responsible use of pool liquidity (repayment speed) |
| Governance     | 10%    | Participation in pool voting & Lindiwe AI feedback  |

## Formula

```
UbuntuScore = (Consistency × 0.4) + (Reciprocity × 0.3) + (Utilization × 0.2) + (Governance × 0.1)
```

Multiplied by `1.05` if `pool.health_rating > 0.95` (Village Multiplier).
Score is capped at **1000**.

## Scoring API

### Get Ubuntu Score

```http
GET /v1/scoring/ubuntu/:userId
Authorization: Bearer <JWT>
```

**Response**

```json
{
  "user_id": "uuid",
  "ubuntu_score": 850,
  "pillars": {
    "consistency": 88,
    "reciprocity": 80,
    "utilization": 92,
    "governance": 60
  },
  "village_boosted": true,
  "calculated_at": "2026-03-17T10:00:00Z"
}
```

## Key Policy Decisions

### No Penalty for Poverty
Low bank balances, missed contributions due to hardship, or low pool withdrawals
**do not penalise** the Ubuntu Score. The scoring engine only rewards *positive*
community actions.

### Leakage Penalty
Withdrawing funds **before completing a full contribution cycle** results in a
"Leakage" penalty applied to the Consistency pillar for the current cycle.

### Village Multiplier
If `pool.health_rating > 0.95` (95%+ of members are consistent), every member
in that pool receives a **+5% Ubuntu Boost** — incentivising collective accountability.

## Integration Notes

- Lindiwe AI (`/v1/lindiwe/evaluate-risk`) calls this endpoint to compute
  recommended lending rates. Higher Ubuntu Scores → lower interest rates.
- Score history is stored in `ubuntu_score_history` with full audit trail.
- The scoring cron job runs every 6 hours via Supabase Edge Functions.

## Security & Data Sovereignty

Row-Level Security (RLS) ensures:
- A villager can only read **their own** score and ledger history.
- The Lindiwe AI service role (`service_role`) can aggregate data for pool health.
- All modifications to `ubuntu_score_history` are append-only and auditable.
