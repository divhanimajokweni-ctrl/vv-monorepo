# ADR 0001: Adopt apps/packages monorepo boundaries

## Status
Accepted

## Context
The repository currently groups too much business logic under broad source folders. This weakens domain boundaries and makes worker/realtime extraction harder.

## Decision
The repository will remain a monorepo, but will adopt:
- apps/* for deployable surfaces
- packages/* for reusable domain and platform modules
- infra/* for deployment and runtime assets

## Consequences
Positive:
- cleaner ownership
- safer scaling path
- simpler worker/realtime extraction
- shared contracts remain atomic

Negative:
- requires import discipline
- requires workspace tooling
- short-term migration cost