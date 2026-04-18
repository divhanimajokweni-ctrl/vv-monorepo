# Dependency Rules

## Allowed
- apps/* -> packages/*
- packages/* -> packages/domain-core
- packages/* -> packages/config
- packages/* -> packages/observability
- packages/* -> packages/db only where persistence is required

## Forbidden
- packages/* -> apps/*
- ui -> db
- realtime -> business policy modules that mutate financial state directly
- route handlers owning reusable domain logic
- worker consumers implementing duplicate domain rules

## Notes
All commands, events, and DTOs crossing app boundaries must be typed centrally.