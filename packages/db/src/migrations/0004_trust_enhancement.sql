-- Ubuntu Pools — Phase 13: Trust Enhancement Migration
-- Reputation Friction, Invite Chains, Portable Passports
-- Run after 0003_cpme.sql

BEGIN;

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE invite_status AS ENUM (
  'pending',
  'accepted',
  'expired',
  'revoked'
);

CREATE TYPE invite_tier AS ENUM (
  'novice',
  'contributor',
  'steward',
  'archivist'
);

-- =============================================================================
-- TABLE: invites (Invite Chain System)
-- =============================================================================

CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL,
  inviter_village_id UUID NOT NULL,
  invitee_email TEXT,
  invitee_name TEXT,
  invite_code TEXT NOT NULL UNIQUE,
  village_id UUID NOT NULL,
  status invite_status NOT NULL DEFAULT 'pending',
  tier invite_tier NOT NULL DEFAULT 'novice',
  max_uses INTEGER NOT NULL DEFAULT 1,
  current_uses INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  inviter_risk_share INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invites_inviter ON invites(inviter_id);
CREATE INDEX idx_invites_code ON invites(invite_code);
CREATE INDEX idx_invites_status ON invites(status);
CREATE INDEX idx_invites_village ON invites(village_id);

-- =============================================================================
-- TABLE: invite_relationships (Trust chain tracking)
-- =============================================================================

CREATE TABLE invite_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL,
  invitee_id UUID NOT NULL,
  invite_id UUID NOT NULL,
  village_id UUID NOT NULL,
  trust_level INTEGER NOT NULL DEFAULT 100,
  risk_share_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invite_relationships_inviter ON invite_relationships(inviter_id);
CREATE INDEX idx_invite_relationships_invitee ON invite_relationships(invitee_id);
CREATE INDEX idx_invite_relationships_village ON invite_relationships(village_id);

-- =============================================================================
-- TABLE: invite_penalties (Risk sharing penalties)
-- =============================================================================

CREATE TABLE invite_penalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL,
  invitee_id UUID NOT NULL,
  reason TEXT NOT NULL,
  penalty_points INTEGER NOT NULL DEFAULT 10,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invite_penalties_inviter ON invite_penalties(inviter_id);
CREATE INDEX idx_invite_penalties_invitee ON invite_penalties(invitee_id);

-- =============================================================================
-- TABLE: anchor_invitations (Community anchor invitations)
-- =============================================================================

CREATE TABLE anchor_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anchor_id UUID NOT NULL,
  anchor_name TEXT NOT NULL,
  anchor_title TEXT,
  village_id UUID NOT NULL,
  community_type TEXT NOT NULL,
  invite_quota INTEGER NOT NULL DEFAULT 50,
  current_invites INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_anchor_invitations_anchor ON anchor_invitations(anchor_id);
CREATE INDEX idx_anchor_invitations_village ON anchor_invitations(village_id);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to calculate invite tier based on trust score
CREATE OR REPLACE FUNCTION get_invite_tier(p_score INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF p_score >= 90 THEN RETURN 'archivist';
  ELSIF p_score >= 75 THEN RETURN 'steward';
  ELSIF p_score >= 50 THEN RETURN 'contributor';
  ELSE RETURN 'novice';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get max invites for a tier
CREATE OR REPLACE FUNCTION get_max_invites(p_tier TEXT)
RETURNS INTEGER AS $$
BEGIN
  CASE p_tier
    WHEN 'archivist' THEN RETURN -1; -- unlimited
    WHEN 'steward' THEN RETURN 10;
    WHEN 'contributor' THEN RETURN 5;
    WHEN 'novice' THEN RETURN 2;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to apply risk share penalty
CREATE OR REPLACE FUNCTION apply_invite_penalty(
  p_inviter_id UUID,
  p_invitee_id UUID,
  p_reason TEXT,
  p_points INTEGER DEFAULT 10
) RETURNS VOID AS $$
BEGIN
  INSERT INTO invite_penalties (inviter_id, invitee_id, reason, penalty_points)
  VALUES (p_inviter_id, p_invitee_id, p_reason, p_points);
  
  UPDATE village_members
  SET ubuntu_score = GREATEST(0, ubuntu_score - p_points)
  WHERE id = p_inviter_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate network depth
CREATE OR REPLACE FUNCTION calculate_network_depth(p_village_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_depth INTEGER := 0;
BEGIN
  WITH RECURSIVE network AS (
    SELECT inviter_id, invitee_id, 1 as depth
    FROM invite_relationships
    WHERE village_id = p_village_id
    
    UNION ALL
    
    SELECT ir.inviter_id, ir.invitee_id, n.depth + 1
    FROM invite_relationships ir
    INNER JOIN network n ON ir.inviter_id = n.invitee_id
    WHERE ir.village_id = p_village_id
    AND n.depth < 10
  )
  SELECT MAX(depth) INTO v_depth FROM network;
  
  RETURN COALESCE(v_depth, 0);
END;
$$ LANGUAGE plpgsql;

COMMIT;
