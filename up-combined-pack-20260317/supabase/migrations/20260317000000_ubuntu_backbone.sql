-- ============================================================
-- Ubuntu Backbone — Core Database Schema
-- Migration: 20260317000000_ubuntu_backbone
-- Platform: Supabase / PostgreSQL
-- Author: divhanimajokweni-ctrl Platform Team
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. VILLAGES (The Pools)
-- ============================================================
CREATE TABLE villages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    description     TEXT,
    slug            TEXT UNIQUE NOT NULL,   -- e.g., 'khayelitsha-pool-01'
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    min_ubuntu_score    INT DEFAULT 400,
    max_capacity        DECIMAL(15, 2) DEFAULT 50000.00,  -- Max ZAR in pool
    current_balance     DECIMAL(15, 2) DEFAULT 0.00,
    health_rating       DECIMAL(5, 4) DEFAULT 1.0,        -- Calculated by Lindiwe AI (0.0 - 1.0)
    is_active           BOOLEAN DEFAULT true,
    region              TEXT DEFAULT 'ZA'                  -- South Africa default
);

COMMENT ON TABLE villages IS 'Self-regulating financial pool groups (Village Pools)';
COMMENT ON COLUMN villages.health_rating IS 'Aggregate pool health computed by Lindiwe AI; range 0.0-1.0';
COMMENT ON COLUMN villages.min_ubuntu_score IS 'Minimum Ubuntu Score required to join this village';

-- Index for slug lookups
CREATE UNIQUE INDEX idx_villages_slug ON villages(slug);

-- ============================================================
-- 2. VILLAGERS (User Profiles)
-- ============================================================
CREATE TABLE villagers (
    id                      UUID REFERENCES auth.users PRIMARY KEY,
    full_name               TEXT,
    display_name            TEXT,
    ubuntu_score            INT DEFAULT 500,               -- Starting base score
    village_id              UUID REFERENCES villages(id),
    total_contributions     DECIMAL(15, 2) DEFAULT 0.00,
    total_withdrawals       DECIMAL(15, 2) DEFAULT 0.00,
    peer_assistance_count   INT DEFAULT 0,
    votes_cast              INT DEFAULT 0,
    on_time_payments        INT DEFAULT 0,
    total_cycles            INT DEFAULT 0,
    is_verified             BOOLEAN DEFAULT false,          -- KYC via Stitch/Plaid
    is_active               BOOLEAN DEFAULT true,
    joined_at               TIMESTAMPTZ DEFAULT now(),
    last_calculation_at     TIMESTAMPTZ,
    stitch_user_id          TEXT,                           -- Stitch/Plaid external reference
    metadata                JSONB DEFAULT '{}'::JSONB
);

COMMENT ON TABLE villagers IS 'User profiles linked to auth.users; central to the Ubuntu scoring system';
COMMENT ON COLUMN villagers.ubuntu_score IS 'Current Ubuntu Score (0-1000). Calculated by Lindiwe AI engine';
COMMENT ON COLUMN villagers.is_verified IS 'KYC verification status via Stitch or Plaid integration';

-- Indexes
CREATE INDEX idx_villagers_village_id ON villagers(village_id);
CREATE INDEX idx_villagers_ubuntu_score ON villagers(ubuntu_score DESC);

-- ============================================================
-- 3. RECIPROCITY LEDGER (Transactions)
-- ============================================================
CREATE TABLE reciprocity_ledger (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id       UUID REFERENCES villagers(id) NOT NULL,
    receiver_id     UUID REFERENCES villagers(id),         -- NULL = Pool contribution
    village_id      UUID REFERENCES villages(id) NOT NULL,
    amount          DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    tx_type         TEXT NOT NULL CHECK (tx_type IN ('contribution', 'withdrawal', 'peer_support')),
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
    created_at      TIMESTAMPTZ DEFAULT now(),
    completed_at    TIMESTAMPTZ,
    stitch_ref_id   TEXT,                                  -- External SA banking reference
    notes           TEXT,
    metadata        JSONB DEFAULT '{}'::JSONB
);

COMMENT ON TABLE reciprocity_ledger IS 'All capital flows within the ecosystem. Lindiwe AI reads this for score computation';
COMMENT ON COLUMN reciprocity_ledger.tx_type IS 'contribution=to pool, withdrawal=from pool, peer_support=villager-to-villager';
COMMENT ON COLUMN reciprocity_ledger.stitch_ref_id IS 'External reference ID for South African payment rails (Stitch/Plaid)';

-- Indexes
CREATE INDEX idx_ledger_sender ON reciprocity_ledger(sender_id);
CREATE INDEX idx_ledger_receiver ON reciprocity_ledger(receiver_id);
CREATE INDEX idx_ledger_village ON reciprocity_ledger(village_id);
CREATE INDEX idx_ledger_type_status ON reciprocity_ledger(tx_type, status);
CREATE INDEX idx_ledger_created_at ON reciprocity_ledger(created_at DESC);

-- ============================================================
-- 4. SCORE HISTORY (Audit Trail)
-- ============================================================
CREATE TABLE ubuntu_score_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    villager_id     UUID REFERENCES villagers(id) NOT NULL,
    previous_score  INT NOT NULL,
    new_score       INT NOT NULL,
    delta           INT GENERATED ALWAYS AS (new_score - previous_score) STORED,
    reason          TEXT,                                  -- Human-readable reason from Lindiwe
    calculated_by   TEXT DEFAULT 'lindiwe-ai',
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE ubuntu_score_history IS 'Immutable audit trail of all Ubuntu Score changes';

CREATE INDEX idx_score_history_villager ON ubuntu_score_history(villager_id, created_at DESC);

-- ============================================================
-- 5. GOVERNANCE VOTES
-- ============================================================
CREATE TABLE governance_votes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    village_id      UUID REFERENCES villages(id) NOT NULL,
    villager_id     UUID REFERENCES villagers(id) NOT NULL,
    proposal_id     TEXT NOT NULL,
    vote_value      TEXT NOT NULL CHECK (vote_value IN ('yes', 'no', 'abstain')),
    voted_at        TIMESTAMPTZ DEFAULT now(),
    UNIQUE(villager_id, proposal_id)
);

COMMENT ON TABLE governance_votes IS 'Governance participation — contributes 10% to Ubuntu Score';

-- ============================================================
-- ROW LEVEL SECURITY (Data Sovereignty)
-- ============================================================

-- Villages: publicly readable
ALTER TABLE villages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Villages are publicly readable"
    ON villages FOR SELECT USING (true);
CREATE POLICY "Only admins can modify villages"
    ON villages FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- Villagers: own profile only (write); village members can read
ALTER TABLE villagers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Villagers can view their own profile"
    ON villagers FOR SELECT
    USING (auth.uid() = id);
CREATE POLICY "Villagers can update their own profile"
    ON villagers FOR UPDATE
    USING (auth.uid() = id);
CREATE POLICY "Lindiwe AI service role can read all villagers"
    ON villagers FOR SELECT
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Reciprocity Ledger: transaction parties + service role
ALTER TABLE reciprocity_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Villagers can view their own transactions"
    ON reciprocity_ledger FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Lindiwe AI service role can read all transactions"
    ON reciprocity_ledger FOR SELECT
    USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Villagers can create transactions"
    ON reciprocity_ledger FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- Score History: read-only to owner
ALTER TABLE ubuntu_score_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Villagers can view their own score history"
    ON ubuntu_score_history FOR SELECT
    USING (auth.uid() = villager_id);
CREATE POLICY "Lindiwe AI can write score history"
    ON ubuntu_score_history FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Governance: can vote once per proposal
ALTER TABLE governance_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Villagers can cast their own votes"
    ON governance_votes FOR INSERT
    WITH CHECK (auth.uid() = villager_id);
CREATE POLICY "Villagers can view village votes"
    ON governance_votes FOR SELECT USING (true);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at on villages
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_villages_updated_at
    BEFORE UPDATE ON villages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update village current_balance on transaction completion
CREATE OR REPLACE FUNCTION update_village_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        IF NEW.tx_type = 'contribution' THEN
            UPDATE villages SET current_balance = current_balance + NEW.amount
            WHERE id = NEW.village_id;
        ELSIF NEW.tx_type = 'withdrawal' THEN
            UPDATE villages SET current_balance = current_balance - NEW.amount
            WHERE id = NEW.village_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_update_village_balance
    AFTER UPDATE ON reciprocity_ledger
    FOR EACH ROW EXECUTE FUNCTION update_village_balance();
