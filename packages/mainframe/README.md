# Mainframe

The Mainframe package contains the Triad Collector service for BayWater's smart water infrastructure.

## Overview

The Triad Collector continuously monitors three independent metric streams for water systems:

- **Flow Rate**: Measured in liters per minute (LPM), checked every 60 seconds
- **Pressure**: Measured in bar, checked every 5 minutes
- **Leak Detection**: Anomaly score (0.0-1.0), checked every 60 seconds

Each metric is signed by a dedicated SafeKrypte key to ensure immutability and authenticity.

## Operation

The collector stores metrics in JSONL files under the `metrics/` directory:

- `flow_rate_lpm.jsonl`
- `pressure_bar.jsonl` 
- `leak_anomaly_score.jsonl`

Breach alerts are stored in `breach-alerts.jsonl`.

## Deployment

The service is deployed on Railway as the "mainframe" service, running continuously.

## Development

To run locally:

```bash
npx tsx src/index.ts
```

Requires environment variables:
- POOL_ID (default: baywater-pool-001)
- POLICY_HASH (default: 0x1234567890abcdef)