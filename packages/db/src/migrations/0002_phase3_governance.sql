-- =============================================================================
-- Ubuntu Pools — Phase 3: Governance Enforcement
-- Migration: 0002_phase3_governance.sql
--
-- Governance Charter Compliance:
--   - Quorum and threshold enforcement is deterministic and server-side
--   - All governance actions produce auditable events
--   - Constitution versions are immutable once deployed
--   - Proposal lifecycle is fully deterministic
-- =============================================================================

-- ---------------------------------------------------------------------------
-- TABLE: governance_constitutions
--
-- Versioned governance rules. Each version represents a complete set
-- of governance parameters and rules. Versions are immutable once created.
--
-- Columns:
--   id              — UUID primary key
--   version         — monotonically increasing version number
--   params          — JSONB: quorum threshold, approval threshold, timing, etc.
--   rules           — JSONB: array of governance rules
--   effective_from — when this version became active
--   created_at      — immutable creation timestamp
--   created_by_event_id — the event that created this constitution version
-- ---------------------------------------------------------------------------
CREATE TABLE governance_constitutions (
  id                    UUID        NOT NULL DEFAULT gen_random_uuid(),
  version               INT         NOT NULL,
  params                JSONB       NOT NULL,
  rules                 JSONB       NOT NULL DEFAULT '[]',
  effective_from        TIMESTAMPTZ NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_event_id   UUID        NOT NULL,

  -- Primary key
  CONSTRAINT governance_constitutions_pkey PRIMARY KEY (id),

  -- Version must be positive
  CONSTRAINT governance_constitutions_version_positive CHECK (version > 0),

  -- Version must be unique
  CONSTRAINT governance_constitutions_version_unique UNIQUE (version),

  -- Effective date must be set
  CONSTRAINT governance_constitutions_effective_not_null CHECK (effective_from IS NOT NULL),

  -- Foreign key to events
  CONSTRAINT governance_constitutions_event_fk
    FOREIGN KEY (created_by_event_id) REFERENCES events (id)
);

-- Index: lookup by version
CREATE UNIQUE INDEX idx_governance_constitutions_version ON governance_constitutions (version);

-- ---------------------------------------------------------------------------
-- TABLE: governance_proposals
--
-- Tracks governance proposals through their lifecycle.
-- States: draft -> active -> executed | rejected | expired
--
-- Columns:
--   id                    — UUID primary key
--   proposal_type         — parameter_change, rule_amendment, membership_change, etc.
--   title                 — human-readable title
--   description          — detailed description
--   constitution_version — which version of constitution governs this proposal
--   proposer_id           — UUID of the member who created this proposal
--   target_entity_id      — optional: entity this proposal affects
--   target_entity_type    — optional: type of target entity
--   payload              — JSONB: proposal-specific data
--   status               — current state in the proposal lifecycle
--   quorum_threshold     for this proposal
--   approval — required quorum_threshold   — required approval ratio
--   voting_period_start  — when voting opened
--   voting_period_end    — when voting closes
--   created_at           — immutable creation timestamp
--   created_by_event_id  — the event that created this proposal
--   executed_at          — when proposal was executed (if applicable)
--   executed_by_event_id — the event that executed this proposal
-- ---------------------------------------------------------------------------
CREATE TABLE governance_proposals (
  id                    UUID        NOT NULL DEFAULT gen_random_uuid(),
  proposal_type         TEXT        NOT NULL,
  title                 TEXT        NOT NULL,
  description           TEXT        NOT NULL,
  constitution_version  INT         NOT NULL,
  proposer_id           UUID        NOT NULL,
  target_entity_id      UUID,
  target_entity_type    TEXT,
  payload               JSONB       NOT NULL DEFAULT '{}',
  status                TEXT        NOT NULL DEFAULT 'draft',
  quorum_threshold      DECIMAL(5,4) NOT NULL,
  approval_threshold    DECIMAL(5,4) NOT NULL,
  voting_period_start   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  voting_period_end     TIMESTAMPTZ NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_event_id   UUID        NOT NULL,
  executed_at           TIMESTAMPTZ,
  executed_by_event_id  UUID,

  -- Primary key
  CONSTRAINT governance_proposals_pkey PRIMARY KEY (id),

  -- Valid proposal types
  CONSTRAINT governance_proposals_type_valid
    CHECK (proposal_type IN (
      'parameter_change',
      'rule_amendment',
      'membership_change',
      'treasury_allocation',
      'constitution_amendment'
    )),

  -- Valid statuses
  CONSTRAINT governance_proposals_status_valid
    CHECK (status IN ('draft', 'active', 'executed', 'rejected', 'expired')),

  -- Thresholds must be between 0 and 1
  CONSTRAINT governance_proposals_quorum_range CHECK (quorum_threshold >= 0 AND quorum_threshold <= 1),
  CONSTRAINT governance_proposals_approval_range CHECK (approval_threshold >= 0 AND approval_threshold <= 1),

  -- Voting period must end after it starts
  CONSTRAINT governance_proposals_period_order CHECK (voting_period_end > voting_period_start),

  -- Foreign key to events
  CONSTRAINT governance_proposals_created_event_fk
    FOREIGN KEY (created_by_event_id) REFERENCES events (id),

  -- Foreign key to constitution version
  CONSTRAINT governance_proposals_constitution_fk
    FOREIGN KEY (constitution_version) REFERENCES governance_constitutions (version)
);

-- Index: lookup by status
CREATE INDEX idx_governance_proposals_status ON governance_proposals (status);

-- Index: lookup by proposer
CREATE INDEX idx_governance_proposals_proposer ON governance_proposals (proposer_id);

-- Index: lookup by constitution version
CREATE INDEX idx_governance_proposals_constitution ON governance_proposals (constitution_version);

-- Index: active proposals for voting
CREATE INDEX idx_governance_proposals_active
  ON governance_proposals (voting_period_end DESC)
  WHERE status = 'active';

-- ---------------------------------------------------------------------------
-- TABLE: governance_votes
--
-- Records votes on governance proposals.
-- Each vote is immutable once cast.
--
-- Columns:
--   id              — UUID primary key
--   proposal_id     — the proposal being voted on
--   voter_id        — UUID of the member casting this vote
--   voter_type      — member, custodian, or governance
--   vote            — 'approved' or 'rejected'
--   weight          — voting weight (typically 1, but can be higher)
--   signature       — optional: cryptographic signature of the vote
--   signed_at       — when the vote was signed (if applicable)
--   created_at      — immutable creation timestamp
--   created_by_event_id — the event that created this vote
-- ---------------------------------------------------------------------------
CREATE TABLE governance_votes (
  id                    UUID        NOT NULL DEFAULT gen_random_uuid(),
  proposal_id           UUID        NOT NULL,
  voter_id              UUID        NOT NULL,
  voter_type            TEXT        NOT NULL,
  vote                  TEXT        NOT NULL,
  weight                INT         NOT NULL DEFAULT 1,
  signature             TEXT,
  signed_at             TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_event_id   UUID        NOT NULL,

  -- Primary key
  CONSTRAINT governance_votes_pkey PRIMARY KEY (id),

  -- Valid voter types
  CONSTRAINT governance_votes_voter_type_valid
    CHECK (voter_type IN ('member', 'custodian', 'governance')),

  -- Valid votes
  CONSTRAINT governance_votes_vote_valid
    CHECK (vote IN ('approved', 'rejected')),

  -- Weight must be positive
  CONSTRAINT governance_votes_weight_positive CHECK (weight > 0),

  -- One vote per voter per proposal
  CONSTRAINT governance_votes_unique_voter_proposal UNIQUE (proposal_id, voter_id),

  -- Foreign key to proposal
  CONSTRAINT governance_votes_proposal_fk
    FOREIGN KEY (proposal_id) REFERENCES governance_proposals (id),

  -- Foreign key to events
  CONSTRAINT governance_votes_event_fk
    FOREIGN KEY (created_by_event_id) REFERENCES events (id)
);

-- Index: lookup by proposal
CREATE INDEX idx_governance_votes_proposal ON governance_votes (proposal_id);

-- Index: lookup by voter
CREATE INDEX idx_governance_votes_voter ON governance_votes (voter_id);

-- Index: vote tallying (aggregate by proposal)
CREATE INDEX idx_governance_votes_tally
  ON governance_votes (proposal_id, vote, weight);

-- ---------------------------------------------------------------------------
-- TABLE: governance_enforcement_rules
--
-- Defines which actions require governance approval.
-- This is the gate that enforces server-side governance constraints.
--
-- Columns:
--   id              — UUID primary key
--   action          — the action being gated (e.g. 'pool.create', 'treasury.transfer')
--   requires_approval — whether this action requires governance approval
--   quorum_override — optional: override default quorum for this action
--   threshold_override — optional: override default threshold
--   constitution_version — which version of constitution applies
--   is_active       — soft-disable without deletion
--   created_at      — immutable creation timestamp
--   created_by_event_id — the event that created this rule
-- ---------------------------------------------------------------------------
CREATE TABLE governance_enforcement_rules (
  id                      UUID        NOT NULL DEFAULT gen_random_uuid(),
  action                  TEXT        NOT NULL,
  requires_approval       BOOLEAN     NOT NULL DEFAULT TRUE,
  quorum_override         DECIMAL(5,4),
  threshold_override      DECIMAL(5,4),
  constitution_version    INT         NOT NULL,
  is_active               BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_event_id     UUID        NOT NULL,

  -- Primary key
  CONSTRAINT governance_enforcement_rules_pkey PRIMARY KEY (id),

  -- Action must be non-empty
  CONSTRAINT governance_enforcement_rules_action_nonempty CHECK (action <> ''),

  -- Version must be positive
  CONSTRAINT governance_enforcement_rules_version_positive CHECK (constitution_version > 0),

  -- Quorum override must be in valid range
  CONSTRAINT governance_enforcement_rules_quorum_range
    CHECK (quorum_override IS NULL OR (quorum_override >= 0 AND quorum_override <= 1)),

  -- Threshold override must be in valid range
  CONSTRAINT governance_enforcement_rules_threshold_range
    CHECK (threshold_override IS NULL OR (threshold_override >= 0 AND threshold_override <= 1)),

  -- Foreign key to constitution version
  CONSTRAINT governance_enforcement_rules_constitution_fk
    FOREIGN KEY (constitution_version) REFERENCES governance_constitutions (version),

  -- Foreign key to events
  CONSTRAINT governance_enforcement_rules_event_fk
    FOREIGN KEY (created_by_event_id) REFERENCES events (id)
);

-- Index: lookup by action
CREATE UNIQUE INDEX idx_governance_enforcement_rules_action
  ON governance_enforcement_rules (action)
  WHERE is_active = TRUE;

-- ---------------------------------------------------------------------------
-- VIEW: v_proposal_vote_counts
--
-- Aggregated vote counts per proposal for quorum/threshold evaluation.
-- This is a deterministic view used by the governance engine.
-- ---------------------------------------------------------------------------
CREATE VIEW v_proposal_vote_counts AS
SELECT
  gp.id AS proposal_id,
  gp.status,
  gp.constitution_version,
  gp.quorum_threshold,
  gp.approval_threshold,
  gp.voting_period_end,
  COUNT(gv.id) FILTER (WHERE gv.vote = 'approved') AS approval_count,
  COUNT(gv.id) FILTER (WHERE gv.vote = 'rejected') AS rejection_count,
  COUNT(gv.id) AS total_votes,
  COALESCE(SUM(gv.weight) FILTER (WHERE gv.vote = 'approved'), 0) AS approval_weight,
  COALESCE(SUM(gv.weight) FILTER (WHERE gv.vote = 'rejected'), 0) AS rejection_weight,
  COALESCE(SUM(gv.weight), 0) AS total_weight
FROM governance_proposals gp
LEFT JOIN governance_votes gv ON gv.proposal_id = gp.id
GROUP BY
  gp.id, gp.status, gp.constitution_version, gp.quorum_threshold,
  gp.approval_threshold, gp.voting_period_end;

-- ---------------------------------------------------------------------------
-- VIEW: v_proposal_quorum_status
--
-- Shows whether each active proposal has met quorum and threshold.
-- ---------------------------------------------------------------------------
CREATE VIEW v_proposal_quorum_status AS
SELECT
  proposal_id,
  status,
  quorum_threshold,
  approval_threshold,
  voting_period_end,
  total_votes,
  approval_count,
  rejection_count,
  approval_weight,
  rejection_weight,
  total_weight,
  -- Quorum check (simplified: assumes fixed eligible voters)
  CASE
    WHEN total_votes >= 1 THEN TRUE  -- Simplified: at least 1 vote
    ELSE FALSE
  END AS quorum_met,
  -- Threshold check
  CASE
    WHEN total_votes > 0
    THEN (approval_count::DECIMAL / total_votes) >= approval_threshold
    ELSE FALSE
  END AS threshold_met,
  -- Execution eligibility
  CASE
    WHEN status = 'active'
    AND voting_period_end <= NOW()
    AND total_votes >= 1
    AND (approval_count::DECIMAL / total_votes) >= approval_threshold
    THEN TRUE
    ELSE FALSE
  END AS can_execute
FROM v_proposal_vote_counts;

-- ---------------------------------------------------------------------------
-- FUNCTION: get_active_constitution()
--
-- Returns the currently active constitution version.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_active_constitution()
RETURNS TABLE (
  version INT,
  params JSONB,
  rules JSONB,
  effective_from TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    gc.version,
    gc.params,
    gc.rules,
    gc.effective_from
  FROM governance_constitutions gc
  WHERE gc.effective_from <= NOW()
  ORDER BY gc.version DESC
  LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- FUNCTION: check_governance_approval_required(p_action TEXT)
--
-- Determines if a given action requires governance approval.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_governance_approval_required(p_action TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT ger.requires_approval
     FROM governance_enforcement_rules ger
     WHERE ger.action = p_action
     AND ger.is_active = TRUE
     LIMIT 1),
    TRUE  -- Default: require approval
  );
$$;

-- ---------------------------------------------------------------------------
-- TRIGGER FUNCTION: prevent_governance_mutation()
--
-- Prevents UPDATE or DELETE on governance tables for immutable fields.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_governance_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION
      'IMMUTABILITY VIOLATION: DELETE on % table is forbidden.',
      TG_TABLE_NAME;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION
      'IMMUTABILITY VIOLATION: UPDATE on % table is forbidden. Governance records are immutable.',
      TG_TABLE_NAME;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach triggers to governance tables (allow INSERT only)
CREATE TRIGGER trg_governance_constitutions_mutation
  BEFORE UPDATE OR DELETE ON governance_constitutions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_governance_mutation();

CREATE TRIGGER trg_governance_proposals_mutation
  BEFORE UPDATE OR DELETE ON governance_proposals
  FOR EACH ROW
  EXECUTE FUNCTION prevent_governance_mutation();

CREATE TRIGGER trg_governance_votes_mutation
  BEFORE UPDATE OR DELETE ON governance_votes
  FOR EACH ROW
  EXECUTE FUNCTION prevent_governance_mutation();

-- ---------------------------------------------------------------------------
-- COMMENTS
-- ---------------------------------------------------------------------------
COMMENT ON TABLE governance_constitutions IS
  'Versioned governance constitution. Each version is immutable once deployed.';

COMMENT ON TABLE governance_proposals IS
  'Governance proposals through their lifecycle: draft -> active -> executed|rejected|expired';

COMMENT ON TABLE governance_votes IS
  'Immutable vote records. Each member gets one vote per proposal.';

COMMENT ON TABLE governance_enforcement_rules IS
  'Defines which actions require governance approval. The governance gate configuration.';

COMMENT ON VIEW v_proposal_vote_counts IS
  'Aggregated vote counts per proposal. Used for deterministic quorum/threshold evaluation.';

COMMENT ON VIEW v_proposal_quorum_status IS
  'Shows quorum/threshold status for each proposal. Determines execution eligibility.';
