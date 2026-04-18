-- Ubuntu Pools Phase 15 — Games & Financial Intelligence Dashboard
-- Migration: 0006_games.sql
 
BEGIN;
 
CREATE TYPE game_id AS ENUM (
  'ubuntu_monopoly', 'pool_simulator', 'credit_ladder',
  'the_commons', 'market_maker'
);
 
CREATE TYPE game_status AS ENUM ('waiting','active','paused','completed','abandoned');
 
CREATE TYPE signal_type AS ENUM (
  'risk_appetite','cooperative_quotient','stress_response',
  'overextension','leadership_index','knowledge_score'
);
 
CREATE TABLE game_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id        VARCHAR(255) NOT NULL,
  game_id          game_id NOT NULL,
  status           game_status NOT NULL DEFAULT 'waiting',
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ,
  duration_ms      INTEGER,
  state_snapshot   JSONB,
  final_score      INTEGER,
  prestige_awarded INTEGER NOT NULL DEFAULT 0,
  is_multiplayer   BOOLEAN NOT NULL DEFAULT FALSE,
  village_id       VARCHAR(255),
  metadata         JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
 
CREATE TABLE game_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES game_sessions(id),
  member_id   VARCHAR(255) NOT NULL,
  sequence    INTEGER NOT NULL,
  event_type  VARCHAR(100) NOT NULL,
  payload     JSONB NOT NULL,
  hash        VARCHAR(64) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, sequence)
);
 
CREATE TABLE prestige_scores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     VARCHAR(255) NOT NULL UNIQUE,
  total_points  INTEGER NOT NULL DEFAULT 0,
  level         SMALLINT NOT NULL DEFAULT 1,
  by_game       JSONB NOT NULL DEFAULT '{}',
  ubuntu_bonus  SMALLINT NOT NULL DEFAULT 0,
  last_updated  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
 
CREATE TABLE prestige_ledger (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   VARCHAR(255) NOT NULL,
  session_id  UUID REFERENCES game_sessions(id),
  points      INTEGER NOT NULL,
  reason      VARCHAR(255) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
 
CREATE TABLE game_telemetry (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     VARCHAR(255) NOT NULL,
  session_id    UUID NOT NULL REFERENCES game_sessions(id),
  signal_type   signal_type NOT NULL,
  value         INTEGER NOT NULL CHECK (value >= 0 AND value <= 100),
  confidence    SMALLINT NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  game_id       game_id NOT NULL,
  consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  erased        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
 
CREATE TABLE village_tournaments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(255) NOT NULL,
  game_id      game_id NOT NULL,
  start_date   TIMESTAMPTZ NOT NULL,
  end_date     TIMESTAMPTZ NOT NULL,
  status       VARCHAR(50) NOT NULL DEFAULT 'upcoming',
  participants JSONB NOT NULL DEFAULT '[]',
  winner_id    VARCHAR(255),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
 
-- Indexes
CREATE INDEX idx_game_sessions_member  ON game_sessions(member_id);
CREATE INDEX idx_game_sessions_game    ON game_sessions(game_id);
CREATE INDEX idx_game_sessions_village ON game_sessions(village_id);
CREATE INDEX idx_game_events_session   ON game_events(session_id);
CREATE INDEX idx_game_events_member    ON game_events(member_id);
CREATE INDEX idx_prestige_ledger       ON prestige_ledger(member_id);
CREATE INDEX idx_game_telemetry_member ON game_telemetry(member_id);
CREATE INDEX idx_game_telemetry_signal ON game_telemetry(signal_type);
 
COMMIT;
