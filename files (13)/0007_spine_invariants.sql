-- drizzle/migrations/0007_spine_invariants.sql
--
-- Spine hardening migration.
-- Adds the tables and DB-level constraints for all 5 invariants.
--
-- Apply:
--   psql $DATABASE_URL < drizzle/migrations/0007_spine_invariants.sql
-- Or via Drizzle:
--   bun db:migrate
--
-- This file deliberately uses raw SQL so the CHECK constraint
-- (Invariant 2) is visible and auditable without reading application code.

BEGIN;

-- ─── Idempotency keys (Invariant 1) ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key              TEXT        PRIMARY KEY,
  ledger_entry_id  TEXT        NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE idempotency_keys IS
  'Invariant 1: every financial write requires an idempotency key. '
  'Duplicate keys indicate a replay — do not re-post.';

-- ─── Ledger entries (Invariants 1 + 2) ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS ledger_entries (
  id             TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id       TEXT          NOT NULL,
  village_id     TEXT          NOT NULL,
  member_id      TEXT          NOT NULL,
  lines          JSONB         NOT NULL,
  total_debits   NUMERIC(20,0) NOT NULL,
  total_credits  NUMERIC(20,0) NOT NULL,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- INVARIANT 2: double-entry balance enforced at DB level.
  -- This constraint fires even if application code is bypassed.
  CONSTRAINT balanced_posting CHECK (total_debits = total_credits)
);

CREATE INDEX IF NOT EXISTS idx_ledger_village_id ON ledger_entries(village_id);
CREATE INDEX IF NOT EXISTS idx_ledger_member_id  ON ledger_entries(member_id);
CREATE INDEX IF NOT EXISTS idx_ledger_event_id   ON ledger_entries(event_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created    ON ledger_entries(created_at DESC);

COMMENT ON CONSTRAINT balanced_posting ON ledger_entries IS
  'Invariant 2: debits must equal credits. '
  'Any INSERT or UPDATE that violates this is rejected immediately by Postgres.';

-- ─── Pool contributions (spine step 3) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pool_contributions (
  id                  TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::text,
  member_id           TEXT          NOT NULL,
  village_id          TEXT          NOT NULL,
  pool_id             TEXT          NOT NULL,
  amount_minor_units  NUMERIC(20,0) NOT NULL,
  currency            TEXT          NOT NULL DEFAULT 'ZAR',
  idempotency_key     TEXT          NOT NULL,
  ledger_entry_id     TEXT,
  status              TEXT          NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING', 'POSTED', 'FAILED')),
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_contributions_idempotency_key UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_contributions_member  ON pool_contributions(member_id);
CREATE INDEX IF NOT EXISTS idx_contributions_village ON pool_contributions(village_id);

-- ─── Domain events (spine step 5 + Invariants 4 + 5) ─────────────────────────
-- Every state change must produce a row here before any downstream action.
-- Reputation mutations and notifications are gated on a row existing here.

CREATE TABLE IF NOT EXISTS domain_events (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type        TEXT        NOT NULL,
  payload     JSONB       NOT NULL,
  hash        TEXT        NOT NULL,
  member_id   TEXT,
  village_id  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_type    ON domain_events(type);
CREATE INDEX IF NOT EXISTS idx_events_village ON domain_events(village_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON domain_events(created_at DESC);

COMMENT ON TABLE domain_events IS
  'Invariants 4 + 5: reputation mutations and notifications must '
  'reference a row in this table. assertNotificationHasEventSource() '
  'and assertReputationMutationIsFromProjection() both query here.';

-- ─── Projections (spine steps 6 + 8) ─────────────────────────────────────────
-- One row per village. The dashboard reads from here.
-- Pool balances are NEVER stored here — they are derived from ledger_entries.

CREATE TABLE IF NOT EXISTS projections (
  village_id    TEXT        PRIMARY KEY,
  last_event_id TEXT        NOT NULL,
  refreshed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE projections IS
  'Invariant 3: pool balance is a query against ledger_entries — '
  'never a value stored in this table. This table tracks projection '
  'lag: the gap between last_event_id and the latest domain_events.id.';

-- ─── Audit log (spine step 9) ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_log (
  id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id        TEXT        NOT NULL REFERENCES domain_events(id),
  member_id       TEXT        NOT NULL,
  village_id      TEXT        NOT NULL,
  action          TEXT        NOT NULL,
  ledger_entry_id TEXT,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_event  ON audit_log(event_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_member ON audit_log(member_id);

-- ─── Projection lag view (operational proof) ──────────────────────────────────
-- Alert when this view shows lag_seconds > 30 or unprocessed_events > 0.
-- Query: SELECT * FROM projection_lag WHERE lag_seconds > 30;

CREATE OR REPLACE VIEW projection_lag AS
SELECT
  p.village_id,
  p.last_event_id,
  p.refreshed_at,
  EXTRACT(EPOCH FROM (NOW() - p.refreshed_at))::numeric(10,1) AS lag_seconds,
  (
    SELECT COUNT(*)
    FROM domain_events de
    WHERE de.village_id = p.village_id
      AND de.created_at > p.refreshed_at
  )::int AS unprocessed_events
FROM projections p;

COMMENT ON VIEW projection_lag IS
  'Operational health: lag_seconds > 30 or unprocessed_events > 0 should trigger an alert. '
  'Healthy state: lag_seconds < 5, unprocessed_events = 0.';

COMMIT;
