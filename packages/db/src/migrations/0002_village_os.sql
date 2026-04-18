-- =============================================================================
-- Ubuntu Pools — Village OS: Programmable Economic Units
-- Migration: 0002_village_os.sql
--
-- This migration adds Village OS tables for:
--   - Villages (economic organizations)
--   - Village members and roles
--   - Liquidity pools (ROSCA/rotating savings)
--   - Pool contributions
--   - Procurement events (bulk purchasing)
--   - Investments (village funding)
--   - Insurance pools
--   - Insurance claims
--   - Village governance (proposals, votes)
--   - Village messaging
--   - Village relations (economic graph)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUM: village_role
-- Roles within a village for governance flexibility.
-- ---------------------------------------------------------------------------
CREATE TYPE village_role AS ENUM (
  'admin',
  'treasurer',
  'member'
);

-- ---------------------------------------------------------------------------
-- ENUM: pool_status
-- Status of liquidity pool cycles.
-- ---------------------------------------------------------------------------
CREATE TYPE pool_status AS ENUM (
  'active',
  'completed',
  'cancelled'
);

-- ---------------------------------------------------------------------------
-- ENUM: pool_type
-- Type of economic pool.
-- ---------------------------------------------------------------------------
CREATE TYPE pool_type AS ENUM (
  'savings',
  'procurement',
  'investment',
  'insurance'
);

-- ---------------------------------------------------------------------------
-- ENUM: contribution_status
-- Status of member contributions to pools.
-- ---------------------------------------------------------------------------
CREATE TYPE contribution_status AS ENUM (
  'pending',
  'paid',
  'missed'
);

-- ---------------------------------------------------------------------------
-- ENUM: procurement_status
-- Status of bulk procurement events.
-- ---------------------------------------------------------------------------
CREATE TYPE procurement_status AS ENUM (
  'proposed',
  'active',
  'completed',
  'cancelled'
);

-- ---------------------------------------------------------------------------
-- ENUM: investment_status
-- Status of village investments.
-- ---------------------------------------------------------------------------
CREATE TYPE investment_status AS ENUM (
  'proposed',
  'approved',
  'active',
  'completed',
  'defaulted'
);

-- ---------------------------------------------------------------------------
-- ENUM: insurance_status
-- Status of insurance pools.
-- ---------------------------------------------------------------------------
CREATE TYPE insurance_status AS ENUM (
  'active',
  'inactive',
  'claim_pending',
  'claim_approved',
  'claim_rejected'
);

-- ---------------------------------------------------------------------------
-- ENUM: claim_status
-- Status of insurance claims.
-- ---------------------------------------------------------------------------
CREATE TYPE claim_status AS ENUM (
  'pending',
  'under_review',
  'approved',
  'rejected',
  'paid'
);

-- ---------------------------------------------------------------------------
-- TABLE: villages
--
-- Each village is a lightweight economic organization with:
--   - members
--   - liquidity pools
--   - governance rules
--   - messaging channels
--   - contribution ledger
--
-- The villageScore represents collective reliability.
-- ---------------------------------------------------------------------------
CREATE TABLE villages (
  id              UUID            NOT NULL DEFAULT gen_random_uuid(),
  name            TEXT            NOT NULL,
  description     TEXT,
  founder_id      UUID,
  village_score   INT             NOT NULL DEFAULT 500,
  liquidity_pool  BIGINT          NOT NULL DEFAULT 0,
  currency        TEXT            NOT NULL DEFAULT 'USD',
  is_public       BOOLEAN         NOT NULL DEFAULT TRUE,
  settings        JSONB           NOT NULL DEFAULT '{}',
  tags            TEXT[]          DEFAULT '{}',
  location        JSONB           NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT villages_pkey PRIMARY KEY (id),
  CONSTRAINT villages_name_nonempty CHECK (name <> '')
);

CREATE INDEX idx_villages_founder ON villages (founder_id);
CREATE INDEX idx_villages_name ON villages (name);
CREATE INDEX idx_villages_score ON villages (village_score);

-- ---------------------------------------------------------------------------
-- TABLE: village_members
--
-- Members of a village with roles and reputation tracking.
-- Roles enable governance flexibility.
-- ---------------------------------------------------------------------------
CREATE TABLE village_members (
  id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
  village_id          UUID            NOT NULL,
  user_id             UUID            NOT NULL,
  role                village_role    NOT NULL DEFAULT 'member',
  ubuntu_score        INT             NOT NULL DEFAULT 0,
  reputation_score    INT             NOT NULL DEFAULT 500,
  total_contributions BIGINT          NOT NULL DEFAULT 0,
  pending_payouts    BIGINT          NOT NULL DEFAULT 0,
  governance_weight   INT             NOT NULL DEFAULT 1,
  joined_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  last_active_at      TIMESTAMPTZ,
  created_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT village_members_pkey PRIMARY KEY (id),
  CONSTRAINT village_members_village_fk FOREIGN KEY (village_id) REFERENCES villages(id) ON DELETE CASCADE,
  CONSTRAINT village_members_village_user_unique UNIQUE (village_id, user_id)
);

CREATE INDEX idx_village_members_village ON village_members (village_id);
CREATE INDEX idx_village_members_user ON village_members (user_id);

-- ---------------------------------------------------------------------------
-- TABLE: liquidity_pools
--
-- Shared economic pools for:
--   - savings pools (ROSCA)
--   - bulk purchasing funds
--   - SME investment pools
-- ---------------------------------------------------------------------------
CREATE TABLE liquidity_pools (
  id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
  village_id          UUID            NOT NULL,
  pool_type           pool_type       NOT NULL,
  name                TEXT            NOT NULL,
  description         TEXT,
  total_funds         BIGINT          NOT NULL DEFAULT 0,
  contribution_amount BIGINT          NOT NULL,
  cycle_duration      INT             NOT NULL DEFAULT 30,
  current_cycle       INT             NOT NULL DEFAULT 1,
  total_cycles        INT             NOT NULL,
  member_count        INT             NOT NULL DEFAULT 0,
  status              pool_status     NOT NULL DEFAULT 'active',
  payout_order        JSONB           NOT NULL DEFAULT '[]',
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT liquidity_pools_pkey PRIMARY KEY (id),
  CONSTRAINT liquidity_pools_village_fk FOREIGN KEY (village_id) REFERENCES villages(id) ON DELETE CASCADE,
  CONSTRAINT liquidity_pools_name_nonempty CHECK (name <> ''),
  CONSTRAINT liquidity_pools_contribution_positive CHECK (contribution_amount > 0),
  CONSTRAINT liquidity_pools_cycles_positive CHECK (total_cycles > 0)
);

CREATE INDEX idx_liquidity_pools_village ON liquidity_pools (village_id);
CREATE INDEX idx_liquidity_pools_type ON liquidity_pools (pool_type);
CREATE INDEX idx_liquidity_pools_status ON liquidity_pools (status);

-- ---------------------------------------------------------------------------
-- TABLE: pool_contributions
--
-- Tracks member contributions to liquidity pools.
-- Each contribution is tied to a specific cycle.
-- ---------------------------------------------------------------------------
CREATE TABLE pool_contributions (
  id          UUID                NOT NULL DEFAULT gen_random_uuid(),
  pool_id     UUID                NOT NULL,
  member_id   UUID                NOT NULL,
  user_id     UUID                NOT NULL,
  cycle       INT                 NOT NULL,
  amount      BIGINT              NOT NULL,
  status      contribution_status NOT NULL DEFAULT 'pending',
  paid_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

  CONSTRAINT pool_contributions_pkey PRIMARY KEY (id),
  CONSTRAINT pool_contributions_pool_fk FOREIGN KEY (pool_id) REFERENCES liquidity_pools(id) ON DELETE CASCADE,
  CONSTRAINT pool_contributions_member_fk FOREIGN KEY (member_id) REFERENCES village_members(id) ON DELETE CASCADE,
  CONSTRAINT pool_contributions_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_pool_contributions_pool ON pool_contributions (pool_id);
CREATE INDEX idx_pool_contributions_member ON pool_contributions (member_id);
CREATE INDEX idx_pool_contributions_cycle ON pool_contributions (cycle);
CREATE INDEX idx_pool_contributions_status ON pool_contributions (status);

-- ---------------------------------------------------------------------------
-- TABLE: procurement_events
--
-- Bulk purchasing events where villages can reduce costs by purchasing together.
-- Example: 10 households buy groceries together.
-- ---------------------------------------------------------------------------
CREATE TABLE procurement_events (
  id                UUID                NOT NULL DEFAULT gen_random_uuid(),
  village_id        UUID                NOT NULL,
  organizer_id     UUID                NOT NULL,
  product          TEXT                NOT NULL,
  description       TEXT,
  total_volume      INT                 NOT NULL,
  individual_price  BIGINT              NOT NULL,
  negotiated_price  BIGINT              NOT NULL,
  savings_percent   INT                 NOT NULL DEFAULT 0,
  participant_count INT                 NOT NULL DEFAULT 0,
  min_participants  INT                 NOT NULL DEFAULT 1,
  deadline          TIMESTAMPTZ,
  status            procurement_status  NOT NULL DEFAULT 'proposed',
  created_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

  CONSTRAINT procurement_events_pkey PRIMARY KEY (id),
  CONSTRAINT procurement_events_village_fk FOREIGN KEY (village_id) REFERENCES villages(id) ON DELETE CASCADE,
  CONSTRAINT procurement_events_product_nonempty CHECK (product <> '')
);

CREATE INDEX idx_procurement_events_village ON procurement_events (village_id);
CREATE INDEX idx_procurement_events_status ON procurement_events (status);

-- ---------------------------------------------------------------------------
-- TABLE: procurement_participants
--
-- Users participating in procurement events.
-- ---------------------------------------------------------------------------
CREATE TABLE procurement_participants (
  id            UUID        NOT NULL DEFAULT gen_random_uuid(),
  event_id      UUID        NOT NULL,
  user_id       UUID        NOT NULL,
  quantity      INT         NOT NULL DEFAULT 1,
  committed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT procurement_participants_pkey PRIMARY KEY (id),
  CONSTRAINT procurement_participants_event_fk FOREIGN KEY (event_id) REFERENCES procurement_events(id) ON DELETE CASCADE,
  CONSTRAINT procurement_participants_event_user_unique UNIQUE (event_id, user_id)
);

CREATE INDEX idx_procurement_participants_event ON procurement_participants (event_id);
CREATE INDEX idx_procurement_participants_user ON procurement_participants (user_id);

-- ---------------------------------------------------------------------------
-- TABLE: investments
--
-- Village investments in local businesses.
-- Returns are distributed proportionally to backers.
-- ---------------------------------------------------------------------------
CREATE TABLE investments (
  id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
  village_id          UUID            NOT NULL,
  business_name       TEXT            NOT NULL,
  description         TEXT,
  investment_amount   BIGINT          NOT NULL,
  expected_return     BIGINT          NOT NULL,
  actual_return       BIGINT,
  return_rate         INT,
  proposal_id         UUID,
  investor_count      INT             NOT NULL DEFAULT 0,
  status              investment_status NOT NULL DEFAULT 'proposed',
  start_date          TIMESTAMPTZ,
  end_date            TIMESTAMPTZ,
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT investments_pkey PRIMARY KEY (id),
  CONSTRAINT investments_village_fk FOREIGN KEY (village_id) REFERENCES villages(id) ON DELETE CASCADE,
  CONSTRAINT investments_business_nonempty CHECK (business_name <> ''),
  CONSTRAINT investments_amount_positive CHECK (investment_amount > 0)
);

CREATE INDEX idx_investments_village ON investments (village_id);
CREATE INDEX idx_investments_status ON investments (status);

-- ---------------------------------------------------------------------------
-- TABLE: investment_backers
--
-- Members who back village investments.
-- ---------------------------------------------------------------------------
CREATE TABLE investment_backers (
  id                  UUID        NOT NULL DEFAULT gen_random_uuid(),
  investment_id       UUID        NOT NULL,
  user_id             UUID        NOT NULL,
  amount              BIGINT      NOT NULL,
  expected_return     BIGINT      NOT NULL,
  paid_at             TIMESTAMPTZ,
  returns_received    BIGINT      NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT investment_backers_pkey PRIMARY KEY (id),
  CONSTRAINT investment_backers_investment_fk FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE,
  CONSTRAINT investment_backers_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_investment_backers_investment ON investment_backers (investment_id);
CREATE INDEX idx_investment_backers_user ON investment_backers (user_id);

-- ---------------------------------------------------------------------------
-- TABLE: insurance_pools
--
-- Community mutual insurance systems.
-- Members contribute monthly; fund used for emergencies.
-- ---------------------------------------------------------------------------
CREATE TABLE insurance_pools (
  id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
  village_id          UUID            NOT NULL,
  name                TEXT            NOT NULL,
  coverage_type       TEXT            NOT NULL,
  description         TEXT,
  monthly_contribution BIGINT        NOT NULL,
  pool_balance        BIGINT          NOT NULL DEFAULT 0,
  coverage_limit      BIGINT,
  member_count        INT             NOT NULL DEFAULT 0,
  claim_count         INT             NOT NULL DEFAULT 0,
  status              insurance_status NOT NULL DEFAULT 'active',
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT insurance_pools_pkey PRIMARY KEY (id),
  CONSTRAINT insurance_pools_village_fk FOREIGN KEY (village_id) REFERENCES villages(id) ON DELETE CASCADE,
  CONSTRAINT insurance_pools_name_nonempty CHECK (name <> ''),
  CONSTRAINT insurance_pools_contribution_positive CHECK (monthly_contribution > 0)
);

CREATE INDEX idx_insurance_pools_village ON insurance_pools (village_id);
CREATE INDEX idx_insurance_pools_type ON insurance_pools (coverage_type);
CREATE INDEX idx_insurance_pools_status ON insurance_pools (status);

-- ---------------------------------------------------------------------------
-- TABLE: insurance_members
--
-- Members enrolled in village insurance pools.
-- ---------------------------------------------------------------------------
CREATE TABLE insurance_members (
  id                    UUID        NOT NULL DEFAULT gen_random_uuid(),
  pool_id               UUID        NOT NULL,
  member_id             UUID        NOT NULL,
  user_id               UUID        NOT NULL,
  coverage_start_date   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_contributions   BIGINT      NOT NULL DEFAULT 0,
  total_claims_paid     BIGINT      NOT NULL DEFAULT 0,
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT insurance_members_pkey PRIMARY KEY (id),
  CONSTRAINT insurance_members_pool_fk FOREIGN KEY (pool_id) REFERENCES insurance_pools(id) ON DELETE CASCADE,
  CONSTRAINT insurance_members_member_fk FOREIGN KEY (member_id) REFERENCES village_members(id) ON DELETE CASCADE,
  CONSTRAINT insurance_members_pool_member_unique UNIQUE (pool_id, member_id)
);

CREATE INDEX idx_insurance_members_pool ON insurance_members (pool_id);
CREATE INDEX idx_insurance_members_member ON insurance_members (member_id);

-- ---------------------------------------------------------------------------
-- TABLE: insurance_claims
--
-- Claims against village insurance pools.
-- Must be approved by the village governance.
-- ---------------------------------------------------------------------------
CREATE TABLE insurance_claims (
  id              UUID        NOT NULL DEFAULT gen_random_uuid(),
  pool_id         UUID        NOT NULL,
  claimant_id     UUID        NOT NULL,
  member_id       UUID        NOT NULL,
  claim_amount    BIGINT      NOT NULL,
  approved_amount BIGINT,
  reason          TEXT        NOT NULL,
  description     TEXT,
  status          claim_status NOT NULL DEFAULT 'pending',
  reviewed_by     UUID,
  reviewed_at     TIMESTAMPTZ,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT insurance_claims_pkey PRIMARY KEY (id),
  CONSTRAINT insurance_claims_pool_fk FOREIGN KEY (pool_id) REFERENCES insurance_pools(id) ON DELETE CASCADE,
  CONSTRAINT insurance_claims_member_fk FOREIGN KEY (member_id) REFERENCES village_members(id) ON DELETE CASCADE,
  CONSTRAINT insurance_claims_amount_positive CHECK (claim_amount > 0)
);

CREATE INDEX idx_insurance_claims_pool ON insurance_claims (pool_id);
CREATE INDEX idx_insurance_claims_claimant ON insurance_claims (claimant_id);
CREATE INDEX idx_insurance_claims_status ON insurance_claims (status);

-- ---------------------------------------------------------------------------
-- TABLE: village_proposals
--
-- Governance proposals within a village.
-- Votes are weighted by Ubuntu Score (sqrt formula).
-- ---------------------------------------------------------------------------
CREATE TABLE village_proposals (
  id                  UUID        NOT NULL DEFAULT gen_random_uuid(),
  village_id          UUID        NOT NULL,
  proposer_id         UUID        NOT NULL,
  proposal_type       TEXT        NOT NULL,
  title               TEXT        NOT NULL,
  description         TEXT        NOT NULL,
  payload             JSONB       NOT NULL DEFAULT '{}',
  status              TEXT        NOT NULL DEFAULT 'draft',
  quorum_threshold    INT         NOT NULL DEFAULT 50,
  approval_threshold  INT         NOT NULL DEFAULT 50,
  voting_period_days  INT         NOT NULL DEFAULT 7,
  votes_for           INT         NOT NULL DEFAULT 0,
  votes_against       INT         NOT NULL DEFAULT 0,
  total_weight        INT         NOT NULL DEFAULT 0,
  voting_period_start TIMESTAMPTZ,
  voting_period_end   TIMESTAMPTZ,
  executed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT village_proposals_pkey PRIMARY KEY (id),
  CONSTRAINT village_proposals_village_fk FOREIGN KEY (village_id) REFERENCES villages(id) ON DELETE CASCADE,
  CONSTRAINT village_proposals_title_nonempty CHECK (title <> '')
);

CREATE INDEX idx_village_proposals_village ON village_proposals (village_id);
CREATE INDEX idx_village_proposals_proposer ON village_proposals (proposer_id);
CREATE INDEX idx_village_proposals_status ON village_proposals (status);

-- ---------------------------------------------------------------------------
-- TABLE: village_votes
--
-- Votes on village proposals.
-- Weight = sqrt(ubuntuScore) to prevent rich users dominating.
-- ---------------------------------------------------------------------------
CREATE TABLE village_votes (
  id          UUID        NOT NULL DEFAULT gen_random_uuid(),
  proposal_id UUID        NOT NULL,
  voter_id    UUID        NOT NULL,
  vote        TEXT        NOT NULL,
  weight      INT         NOT NULL DEFAULT 1,
  signature   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT village_votes_pkey PRIMARY KEY (id),
  CONSTRAINT village_votes_proposal_fk FOREIGN KEY (proposal_id) REFERENCES village_proposals(id) ON DELETE CASCADE,
  CONSTRAINT village_votes_proposal_voter_unique UNIQUE (proposal_id, voter_id)
);

CREATE INDEX idx_village_votes_proposal ON village_votes (proposal_id);
CREATE INDEX idx_village_votes_voter ON village_votes (voter_id);

-- ---------------------------------------------------------------------------
-- TABLE: village_messages
--
-- Dedicated encrypted channels per village.
-- Integrates with economic events.
-- ---------------------------------------------------------------------------
CREATE TABLE village_messages (
  id              UUID        NOT NULL DEFAULT gen_random_uuid(),
  village_id      UUID        NOT NULL,
  channel         TEXT        NOT NULL DEFAULT 'general',
  sender_id       UUID        NOT NULL,
  content         TEXT        NOT NULL,
  is_encrypted    BOOLEAN     NOT NULL DEFAULT FALSE,
  event_reference TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT village_messages_pkey PRIMARY KEY (id),
  CONSTRAINT village_messages_village_fk FOREIGN KEY (village_id) REFERENCES villages(id) ON DELETE CASCADE
);

CREATE INDEX idx_village_messages_village ON village_messages (village_id);
CREATE INDEX idx_village_messages_channel ON village_messages (channel);
CREATE INDEX idx_village_messages_sender ON village_messages (sender_id);

-- ---------------------------------------------------------------------------
-- TABLE: village_relations
--
-- Links between villages for economic graph expansion.
-- Edges represent trade, investments, procurement.
-- ---------------------------------------------------------------------------
CREATE TABLE village_relations (
  id              UUID        NOT NULL DEFAULT gen_random_uuid(),
  from_village_id UUID        NOT NULL,
  to_village_id   UUID        NOT NULL,
  relation_type   TEXT        NOT NULL,
  description     TEXT,
  trade_volume    BIGINT      NOT NULL DEFAULT 0,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT village_relations_pkey PRIMARY KEY (id),
  CONSTRAINT village_relations_from_fk FOREIGN KEY (from_village_id) REFERENCES villages(id) ON DELETE CASCADE,
  CONSTRAINT village_relations_to_fk FOREIGN KEY (to_village_id) REFERENCES villages(id) ON DELETE CASCADE,
  CONSTRAINT village_relations_unique UNIQUE (from_village_id, to_village_id, relation_type)
);

CREATE INDEX idx_village_relations_from ON village_relations (from_village_id);
CREATE INDEX idx_village_relations_to ON village_relations (to_village_id);

-- ---------------------------------------------------------------------------
-- VIEW: v_village_details
--
-- Comprehensive view of village with member count and pool stats.
-- ---------------------------------------------------------------------------
CREATE VIEW v_village_details AS
SELECT
  v.id,
  v.name,
  v.description,
  v.village_score,
  v.liquidity_pool,
  v.currency,
  v.created_at,
  COUNT(DISTINCT vm.id) AS member_count,
  COUNT(DISTINCT lp.id) AS pool_count,
  COALESCE(SUM(lp.total_funds), 0) AS total_pool_funds
FROM villages v
LEFT JOIN village_members vm ON vm.village_id = v.id
LEFT JOIN liquidity_pools lp ON lp.village_id = v.id
GROUP BY v.id, v.name, v.description, v.village_score, v.liquidity_pool, v.currency, v.created_at;

-- ---------------------------------------------------------------------------
-- VIEW: v_pool_member_contributions
--
-- Member contributions per pool with status.
-- ---------------------------------------------------------------------------
CREATE VIEW v_pool_member_contributions AS
SELECT
  lp.id AS pool_id,
  lp.name AS pool_name,
  lp.village_id,
  vm.user_id,
  vm.role,
  pc.cycle,
  pc.amount,
  pc.status,
  pc.paid_at
FROM liquidity_pools lp
JOIN pool_contributions pc ON pc.pool_id = lp.id
JOIN village_members vm ON vm.id = pc.member_id;

-- ---------------------------------------------------------------------------
-- FUNCTION: calculate_village_score(village_id UUID)
--
-- Calculates village score based on:
--   - Avg user score (40%)
--   - Transaction volume (30%)
--   - Pool stability (20%)
--   - Governance participation (10%)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_village_score(p_village_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_avg_user_score NUMERIC;
  v_transaction_volume NUMERIC;
  v_pool_stability NUMERIC;
  v_governance_participation NUMERIC;
  v_result INTEGER;
BEGIN
  -- Avg User Score (40%)
  SELECT COALESCE(AVG(vm.ubuntu_score), 0)
  INTO v_avg_user_score
  FROM village_members vm
  WHERE vm.village_id = p_village_id;

  -- Transaction Volume (30%) - based on total contributions
  SELECT COALESCE(SUM(vm.total_contributions), 0)
  INTO v_transaction_volume
  FROM village_members vm
  WHERE vm.village_id = p_village_id;

  -- Normalize to 0-1000 scale (log scale for large values)
  v_transaction_volume := LEAST(1000, LOG(GREATEST(1, v_transaction_volume + 1)) * 100);

  -- Pool Stability (20%) - based on completed vs total cycles
  SELECT COALESCE(
    AVG(CASE
      WHEN lp.total_cycles > 0
      THEN (lp.current_cycle * 100.0 / lp.total_cycles)
      ELSE 100
    END), 100)
  INTO v_pool_stability
  FROM liquidity_pools lp
  WHERE lp.village_id = p_village_id AND lp.status = 'active';

  -- Governance Participation (10%) - based on voting participation
  SELECT COALESCE(
    (COUNT(DISTINCT vp.id) * 10) +
    (COUNT(DISTINCT vv.id) * 5), 0)
  INTO v_governance_participation
  FROM village_members vm
  LEFT JOIN village_proposals vp ON vp.village_id = vm.village_id
  LEFT JOIN village_votes vv ON vv.proposal_id = vp.id AND vv.voter_id = vm.user_id
  WHERE vm.village_id = p_village_id;

  v_governance_participation := LEAST(1000, v_governance_participation);

  -- Calculate weighted score
  v_result := ROUND(
    (v_avg_user_score * 0.4) +
    (v_transaction_volume * 0.3) +
    (v_pool_stability * 0.2) +
    (v_governance_participation * 0.1)
  )::INTEGER;

  -- Ensure score is within bounds
  v_result := GREATEST(100, LEAST(1000, v_result));

  RETURN v_result;
END;
$$;

-- ---------------------------------------------------------------------------
-- FUNCTION: calculate_governance_weight(ubuntu_score INTEGER)
--
-- Calculates governance weight using square root formula.
-- Prevents rich users dominating while rewarding trust.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_governance_weight(p_ubuntu_score INTEGER)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT GREATEST(1, FLOOR(SQRT(GREATEST(0, p_ubuntu_score))))::INTEGER;
$$;

-- ---------------------------------------------------------------------------
-- COMMENTS: Documentation
-- ---------------------------------------------------------------------------
COMMENT ON TABLE villages IS
  'Programmable economic units. Each village has members, liquidity pools, governance, and messaging.';

COMMENT ON TABLE village_members IS
  'Members of villages with roles (admin, treasurer, member) and reputation tracking.';

COMMENT ON TABLE liquidity_pools IS
  'Shared economic pools: savings (ROSCA), procurement, investment, insurance pools.';

COMMENT ON TABLE pool_contributions IS
  'Member contributions to liquidity pools, tracked per cycle.';

COMMENT ON TABLE procurement_events IS
  'Bulk purchasing events where villages can reduce costs through collective buying.';

COMMENT ON TABLE investments IS
  'Village investments in local businesses. Returns distributed proportionally.';

COMMENT ON TABLE insurance_pools IS
  'Community mutual insurance systems for emergencies, medical, funeral expenses.';

COMMENT ON TABLE insurance_claims IS
  'Claims against insurance pools, require village governance approval.';

COMMENT ON TABLE village_proposals IS
  'Governance proposals within villages. Votes weighted by sqrt(Ubuntu Score).';

COMMENT ON TABLE village_votes IS
  'Votes on proposals. Weight = sqrt(ubuntuScore) to prevent dominance.';

COMMENT ON TABLE village_messages IS
  'Dedicated messaging channels per village, integrates with economic events.';

COMMENT ON TABLE village_relations IS
  'Links between villages forming economic graph (trade, investments, procurement).';

COMMENT ON FUNCTION calculate_village_score IS
  'Calculates village reliability score: 0.4*AvgUserScore + 0.3*TxVolume + 0.2*PoolStability + 0.1*GovernanceParticipation';

COMMENT ON FUNCTION calculate_governance_weight IS
  'Governance weight = sqrt(ubuntuScore). Prevents rich users dominating while rewarding trust.';
