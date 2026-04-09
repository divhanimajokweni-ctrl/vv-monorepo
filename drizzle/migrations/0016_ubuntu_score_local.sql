-- Ubuntu Score table with local inference tracking
CREATE TABLE IF NOT EXISTS ubuntu_scores (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
composite INTEGER NOT NULL CHECK (composite BETWEEN 0 AND 100),
trend TEXT NOT NULL CHECK (trend IN ('rising','stable','declining')),
nudge TEXT NOT NULL,
next_milestone TEXT NOT NULL,
factors JSONB NOT NULL DEFAULT '{}',
inferred_locally BOOLEAN NOT NULL DEFAULT FALSE,
computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CONSTRAINT ubuntu_scores_member_unique UNIQUE (member_id)
);
-- Score history for trend analysis (never deleted)
CREATE TABLE IF NOT EXISTS ubuntu_score_history (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
member_id UUID NOT NULL REFERENCES members(id),
composite INTEGER NOT NULL,
factors JSONB NOT NULL,
inferred_locally BOOLEAN NOT NULL,
computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Trigger: auto-append to history on every score update
CREATE OR REPLACE FUNCTION append_score_history()
RETURNS TRIGGER AS $$
BEGIN
INSERT INTO ubuntu_score_history
(member_id, NEW.composite, NEW.factors, NEW.inferred_locally, NEW.computed_at);
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER trg_ubuntu_score_history
AFTER INSERT OR UPDATE ON ubuntu_scores
FOR EACH ROW EXECUTE FUNCTION append_score_history();
-- SafeStake redirections (feeds score engine)
CREATE TABLE IF NOT EXISTS safestake_redirections (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
member_id UUID NOT NULL REFERENCES members(id),
amount_zar NUMERIC(10,2) NOT NULL,
from_platform TEXT NOT NULL,
to_pool_id UUID REFERENCES stokvels(id),
redirected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE ubuntu_scores IS
'Current Ubuntu Score per member. Computed locally via Gemma 4 — no user data leaves the
platform.';