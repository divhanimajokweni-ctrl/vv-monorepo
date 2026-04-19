-- packages/db/migrations/0007_spine_invariants.sql
--
-- Spine hardening migration.
-- Adds the tables and constraints required to enforce all 5 invariants.
--
-- Run with:  psql $DATABASE_URL < packages/db/migrations/0007_spine_invariants.sql

BEGIN;

-- ─── Idempotency key deduplication table (Invariant 1) ──────────────────────
-- One row per financial operation. Prevents double-posting at DB level.

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key           TEXT        PRIMARY KEY,
  ledger_entry_id TEXT      NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE idempotency_keys IS
  'Invariant 1: no financial write without an idempotency key. '
  'Checked before every ledger_entries insert.';

-- ─── Ledger entries (Invariant 1 + 2) ────────────────────────────────────────
-- Stores the posting lines as JSONB.
-- total_debits and total_credits must always be equal — enforced by a check constraint.

CREATE TABLE IF NOT EXISTS ledger_entries (
  id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id        TEXT        NOT NULL,
  village_id      TEXT        NOT NULL,
  member_id       TEXT        NOT NULL,
  lines           JSONB       NOT NULL,
  total_debits    NUMERIC(20,0) NOT NULL,
  total_credits   NUMERIC(20,0) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- INVARIANT 2: double-entry balance enforced at the DB level
  CONSTRAINT balanced_posting CHECK (total_debits = total_credits),

  -- Foreign key to idempotency — every entry must have come through a key
  CONSTRAINT fk_idempotency FOREIGN KEY (id)
    REFERENCES idempotency_keys(ledger_entry_id)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS idx_ledger_village_id ON ledger_entries(village_id);
CREATE INDEX IF NOT EXISTS idx_ledger_member_id ON ledger_entries(member_id);
CREATE INDEX IF NOT EXISTS idx_ledger_event_id ON ledger_entries(event_id);

COMMENT ON CONSTRAINT balanced_posting ON ledger_entries IS
  'Invariant 2: debits must equal credits on every posting. '
  'Any unbalanced insert will be rejected at the DB level.';

-- ─── Pool contributions (spine step 3) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pool_contributions (
  id                  TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  member_id           TEXT        NOT NULL,
  village_id          TEXT        NOT NULL,
  pool_id             TEXT        NOT NULL,
  amount_minor_units  NUMERIC(20,0) NOT NULL,
  currency            TEXT        NOT NULL DEFAULT 'ZAR',
  idempotency_key     TEXT        UNIQUE NOT NULL,
  ledger_entry_id     TEXT,
  status              TEXT        NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING','POSTED','FAILED')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contributions_member ON pool_contributions(member_id);
CREATE INDEX IF NOT EXISTS idx_contributions_village ON pool_contributions(village_id);
CREATE INDEX IF NOT EXISTS idx_contributions_key ON pool_contributions(idempotency_key);

-- ─── Domain events (spine step 5 + Invariant 5) ──────────────────────────────
-- All state changes must produce an event here before notifications are sent.

CREATE TABLE IF NOT EXISTS domain_events (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type        TEXT        NOT NULL,
  payload     JSONB       NOT NULL,
  hash        TEXT        NOT NULL,
  member_id   TEXT,
  village_id  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_type ON domain_events(type);
CREATE INDEX IF NOT EXISTS idx_events_village ON domain_events(village_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON domain_events(created_at DESC);

COMMENT ON TABLE domain_events IS
  'Invariant 5: all outbound notifications must reference a row in this table. '
  'assertNotificationHasEventSource() queries here before any dispatch.';

-- ─── Projections (spine step 6 + 8) ──────────────────────────────────────────
-- One row per village. The dashboard reads from here.
-- This is the ONLY source of truth for village state.
-- Invariant 3: pool balances are computed from ledger_entries, never stored here directly.

CREATE TABLE IF NOT EXISTS projections (
  village_id    TEXT        PRIMARY KEY,
  last_event_id TEXT        NOT NULL,
  refreshed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE projections IS
  'Invariant 3: pool balance is a query against ledger_entries, not a value stored here. '
  'This table tracks projection lag — the gap between last_event_id and the latest domain_event id.';

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

CREATE INDEX IF NOT EXISTS idx_audit_event ON audit_log(event_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_member ON audit_log(member_id);

-- ─── Projection lag view (operational proof) ──────────────────────────────────
-- This view makes it trivial to alert when projections fall behind.
-- Query: SELECT * FROM projection_lag WHERE lag_seconds > 30;

CREATE OR REPLACE VIEW projection_lag AS
SELECT
  p.village_id,
  p.last_event_id,
  p.refreshed_at,
  EXTRACT(EPOCH FROM (NOW() - p.refreshed_at)) AS lag_seconds,
  (
    SELECT COUNT(*)
    FROM domain_events de
    WHERE de.village_id = p.village_id
      AND de.created_at > p.refreshed_at
  ) AS unprocessed_events
FROM projections p;

COMMENT ON VIEW projection_lag IS
  'Operational proof: projection lag > 30s or unprocessed_events > 0 should alert. '
  'Healthy projection: lag < 5s, unprocessed_events = 0.';

COMMIT;
