-- Track whether classifications were made locally or via cloud.
-- Useful for POPIA audit trails and measuring local inference adoption.
ALTER TABLE incidents
ADD COLUMN IF NOT EXISTS inferred_locally BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS inference_model TEXT,
ADD COLUMN IF NOT EXISTS inference_latency_ms INTEGER;
-- Policy engine: add local_only flag per zone/client
ALTER TABLE policies
ADD COLUMN IF NOT EXISTS enforce_local_inference BOOLEAN NOT NULL DEFAULT
FALSE,
ADD COLUMN IF NOT EXISTS nemoclaw_policy_id TEXT;
-- Index for compliance reporting
CREATE INDEX IF NOT EXISTS idx_incidents_inferred_locally
ON incidents (inferred_locally, created_at DESC);
COMMENT ON COLUMN incidents.inferred_locally IS
'TRUE = processed on-device (POPIA compliant). FALSE = cloud inference used.';