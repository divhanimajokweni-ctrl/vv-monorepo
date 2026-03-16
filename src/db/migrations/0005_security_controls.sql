-- Ubuntu Pools — Phase 15: Security Control Inventory
-- Security controls register, evidence tracking, and compliance
-- Run after 0004_trust_enhancement.sql

BEGIN;

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE control_category AS ENUM (
  'INFRASTRUCTURE',
  'ORGANIZATIONAL',
  'PRODUCT',
  'INTERNAL_PROCEDURES',
  'DATA_PRIVACY'
);

CREATE TYPE control_status AS ENUM (
  'implemented',
  'partial',
  'missing',
  'not_applicable'
);

CREATE TYPE control_priority AS ENUM (
  'critical',
  'high',
  'medium',
  'low'
);

CREATE TYPE evidence_type AS ENUM (
  'document',
  'screenshot',
  'log',
  'configuration',
  'test_report',
  'audit_report',
  'policy',
  'procedure'
);

CREATE TYPE risk_level AS ENUM (
  'critical',
  'high',
  'medium',
  'low'
);

-- =============================================================================
-- TABLE: security_controls
-- =============================================================================

CREATE TABLE security_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id TEXT NOT NULL UNIQUE,
  category control_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  system_component TEXT NOT NULL,
  status control_status NOT NULL DEFAULT 'missing',
  priority control_priority NOT NULL DEFAULT 'medium',
  owner TEXT,
  risk_level risk_level,
  gap_description TEXT,
  recommendation TEXT,
  related_controls JSONB NOT NULL DEFAULT '[]',
  framework_references JSONB NOT NULL DEFAULT '[]',
  effective_date TIMESTAMPTZ,
  last_review_date TIMESTAMPTZ,
  next_review_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_security_controls_category ON security_controls(category);
CREATE INDEX idx_security_controls_status ON security_controls(status);
CREATE INDEX idx_security_controls_priority ON security_controls(priority);

-- =============================================================================
-- TABLE: control_evidence
-- =============================================================================

CREATE TABLE control_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id UUID NOT NULL REFERENCES security_controls(id) ON DELETE CASCADE,
  evidence_type evidence_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  evidence_url TEXT,
  evidence_hash TEXT,
  submitted_by UUID,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_control_evidence_control ON control_evidence(control_id);
CREATE INDEX idx_control_evidence_submitter ON control_evidence(submitted_by);
CREATE INDEX idx_control_evidence_verifier ON control_evidence(verified_by);

-- =============================================================================
-- TABLE: control_assessments
-- =============================================================================

CREATE TABLE control_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id UUID NOT NULL REFERENCES security_controls(id) ON DELETE CASCADE,
  assessor_id UUID NOT NULL,
  assessment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status control_status NOT NULL,
  previous_status control_status,
  notes TEXT,
  findings JSONB NOT NULL DEFAULT '[]',
  remediation_plan TEXT,
  remediation_due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_control_assessments_control ON control_assessments(control_id);
CREATE INDEX idx_control_assessments_assessor ON control_assessments(assessor_id);
CREATE INDEX idx_control_assessments_date ON control_assessments(assessment_date);

-- =============================================================================
-- TABLE: security_incidents
-- =============================================================================

CREATE TABLE security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity risk_level NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  affected_controls JSONB NOT NULL DEFAULT '[]',
  affected_systems JSONB NOT NULL DEFAULT '[]',
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  reported_by UUID,
  assigned_to UUID,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX idx_security_incidents_status ON security_incidents(status);
CREATE INDEX idx_security_incidents_detected ON security_incidents(detected_at);

-- =============================================================================
-- TABLE: control_frameworks
-- =============================================================================

CREATE TABLE control_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  reference_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name, version)
);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to update control timestamp
CREATE OR REPLACE FUNCTION update_control_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp on security_controls
CREATE TRIGGER trigger_security_controls_updated
  BEFORE UPDATE ON security_controls
  FOR EACH ROW
  EXECUTE FUNCTION update_control_timestamp();

-- Function to generate incident ID
CREATE OR REPLACE FUNCTION generate_incident_id()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_count INTEGER;
  v_id TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COUNT(*) + 1 INTO v_count
  FROM security_incidents
  WHERE incident_id LIKE 'INC-' || v_year || '-%';
  
  v_id := 'INC-' || v_year || '-' || LPAD(v_count::TEXT, 5, '0');
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get control status summary
CREATE OR REPLACE FUNCTION get_control_status_summary()
RETURNS TABLE (
  category control_category,
  status control_status,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.category,
    sc.status,
    COUNT(*)::BIGINT
  FROM security_controls sc
  GROUP BY sc.category, sc.status
  ORDER BY sc.category, sc.status;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate control maturity score
CREATE OR REPLACE FUNCTION calculate_control_maturity_score()
RETURNS JSONB AS $$
DECLARE
  v_score JSONB;
  v_total INTEGER;
  v_implemented INTEGER;
  v_partial INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total FROM security_controls WHERE status != 'not_applicable';
  
  SELECT COUNT(*) INTO v_implemented 
  FROM security_controls 
  WHERE status = 'implemented';
  
  SELECT COUNT(*) INTO v_partial 
  FROM security_controls 
  WHERE status = 'partial';
  
  v_score := JSONB_BUILD_OBJECT(
    'total_controls', v_total,
    'implemented', v_implemented,
    'partial', v_partial,
    'missing', v_total - v_implemented - v_partial,
    'implementation_percentage', CASE 
      WHEN v_total > 0 THEN ROUND((v_implemented::NUMERIC / v_total::NUMERIC) * 100, 1)
      ELSE 0
    END,
    'calculated_at', NOW()
  );
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SEED DEFAULT CONTROLS
-- =============================================================================

INSERT INTO control_frameworks (name, version, description, reference_url) VALUES
  ('OWASP ASVS', '4.0', 'Application Security Verification Standard', 'https://owasp.org/www-project-application-security-verification-standard/'),
  ('NIST SSDF', '1.1', 'Secure Software Development Framework', 'https://csrc.nist.gov/publications/detail/sp/800-218/final'),
  ('POPIA', '2021', 'Protection of Personal Information Act (South Africa)', 'https://popia.co.za/'),
  ('ISO 27001', '2022', 'Information Security Management', 'https://www.iso.org/standard/27001');

-- Infrastructure Controls
INSERT INTO security_controls (control_id, category, title, description, system_component, status, priority, owner, risk_level, framework_references) VALUES
('INF-01', 'INFRASTRUCTURE', 'Network Segmentation', 'Network segmentation between public API, DB, cache, websocket services', 'Hosting/cloud infra', 'partial', 'critical', 'DevOps', 'high', '["OWASP ASVS 1.2", "ISO 27001 A.13"]'),
('INF-02', 'INFRASTRUCTURE', 'Secure Secret Storage', 'Secure secret storage for DB creds, bank keys, signing keys', 'Environment configuration', 'partial', 'critical', 'DevOps', 'high', '["OWASP ASVS 2.10", "NIST SSDF SC.1"]'),
('INF-03', 'INFRASTRUCTURE', 'Key Rotation', 'Event signing keys rotated regularly', 'src/lib/events', 'missing', 'high', 'Security', 'medium', '["NIST SSDF SC.3"]'),
('INF-04', 'INFRASTRUCTURE', 'Backup and DR', 'Database backup and disaster recovery for ledger', 'PostgreSQL', 'missing', 'critical', 'DevOps', 'critical', '["ISO 27001 A.12.3"]'),
('INF-05', 'INFRASTRUCTURE', 'WebSocket Authentication', 'WebSocket authentication and authorization', 'src/lib/websocket', 'partial', 'high', 'Engineering', 'medium', '["OWASP ASVS 2.2"]'),
('INF-06', 'INFRASTRUCTURE', 'Rate Limiting', 'Rate limiting and bot mitigation', 'API gateway', 'partial', 'high', 'DevOps', 'medium', '["OWASP ASVS 1.8"]');

-- Organizational Controls
INSERT INTO security_controls (control_id, category, title, description, system_component, status, priority, owner, risk_level, framework_references) VALUES
('ORG-01', 'ORGANIZATIONAL', 'RBAC Implementation', 'Role-based access control for internal systems', 'src/lib/access', 'implemented', 'critical', 'Security', 'low', '["OWASP ASVS 1.7", "ISO 27001 A.9"]'),
('ORG-02', 'ORGANIZATIONAL', 'Founder Override Controls', 'Founder override actions logged immutably with dual approval', 'OpenClaw integration', 'partial', 'critical', 'Security', 'critical', '["NIST SSDF SC.2"]'),
('ORG-03', 'ORGANIZATIONAL', 'Incident Response', 'Incident response procedures and runbooks', 'Operations', 'missing', 'critical', 'Security', 'high', '["ISO 27001 A.16"]'),
('ORG-04', 'ORGANIZATIONAL', 'Vendor Risk', 'Vendor risk assessment for external dependencies', 'Stitch, AI providers', 'missing', 'high', 'Legal/Security', 'medium', '["ISO 27001 A.15"]'),
('ORG-05', 'ORGANIZATIONAL', 'Security Training', 'Employee security training program', 'Internal procedures', 'missing', 'medium', 'HR/Security', 'medium', '["NIST SSDF ST.1"]');

-- Product Controls
INSERT INTO security_controls (control_id, category, title, description, system_component, status, priority, owner, risk_level, framework_references) VALUES
('PROD-01', 'PRODUCT', 'Immutable Ledger', 'Immutable ledger with cryptographic hash chaining', 'src/lib/ledger', 'implemented', 'critical', 'Engineering', 'low', '["OWASP ASVS 7.7"]'),
('PROD-02', 'PRODUCT', 'Double-Entry Bookkeeping', 'Double-entry bookkeeping enforced before commit', 'Posting engine', 'implemented', 'critical', 'Engineering', 'low', '["OWASP ASVS 7.6"]'),
('PROD-03', 'PRODUCT', 'Reputation Anti-Inflation', 'Reputation system resistant to inflation', 'src/lib/reputation', 'implemented', 'high', 'Engineering', 'medium', '["NIST SSDF SC.2"]'),
('PROD-04', 'PRODUCT', 'Sybil Defense', 'Sybil attack prevention mechanisms', 'src/lib/sybil', 'implemented', 'critical', 'Security', 'medium', '["NIST SSDF SC.2"]'),
('PROD-05', 'PRODUCT', 'Governance Rules', 'Governance rule engine enforces constitutional constraints', 'src/lib/governance', 'implemented', 'critical', 'Engineering', 'low', '["OWASP ASVS 1.5"]'),
('PROD-06', 'PRODUCT', 'Credit Pool Health', 'Credit pool health validation before loan issuance', 'credit-service.ts', 'implemented', 'critical', 'Finance/Engineering', 'low', '["OWASP ASVS 7.4"]'),
('PROD-07', 'PRODUCT', 'Fraud Detection', 'Fraud detection via trust graph analysis', 'src/lib/trust-graph', 'implemented', 'high', 'Security', 'medium', '["NIST SSDF SC.2"]');

-- Internal Procedures Controls
INSERT INTO security_controls (control_id, category, title, description, system_component, status, priority, owner, risk_level, framework_references) VALUES
('PROC-01', 'INTERNAL_PROCEDURES', 'Secure SDLC', 'Secure SDLC with code review and testing', 'CI/CD pipeline', 'partial', 'critical', 'Engineering', 'medium', '["NIST SSDF SC.1"]'),
('PROC-02', 'INTERNAL_PROCEDURES', 'Dependency Scanning', 'Dependency vulnerability scanning', 'CI/CD', 'partial', 'high', 'DevOps', 'medium', '["NIST SSDF SC.3"]'),
('PROC-03', 'INTERNAL_PROCEDURES', 'Secrets Scanning', 'Secrets scanning in source code', 'Repository', 'missing', 'critical', 'DevOps', 'high', '["NIST SSDF SC.1"]'),
('PROC-04', 'INTERNAL_PROCEDURES', 'Security Logging', 'Security logging and monitoring', 'Observability stack', 'partial', 'high', 'Security', 'medium', '["ISO 27001 A.12.4"]'),
('PROC-05', 'INTERNAL_PROCEDURES', 'Abuse Testing', 'Abuse simulation testing', 'QA', 'missing', 'high', 'Security', 'high', '["NIST SSDF ST.2"]');

-- Data & Privacy Controls
INSERT INTO security_controls (control_id, category, title, description, system_component, status, priority, owner, risk_level, framework_references) VALUES
('DATA-01', 'DATA_PRIVACY', 'Data Export', 'Data export capability for members', 'src/lib/privacy/sovereignty.ts', 'implemented', 'critical', 'Engineering', 'low', '["POPIA Art 14", "OWASP ASVS 1.4"]'),
('DATA-02', 'DATA_PRIVACY', 'Right to Deletion', 'Right to deletion implemented', 'Privacy module', 'implemented', 'critical', 'Engineering', 'low', '["POPIA Art 17", "OWASP ASVS 1.4"]'),
('DATA-03', 'DATA_PRIVACY', 'Selective Disclosure', 'Selective disclosure credentials', 'Passport module', 'implemented', 'high', 'Engineering', 'low', '["OWASP ASVS 1.4"]'),
('DATA-04', 'DATA_PRIVACY', 'Consent Management', 'Consent management for data sharing', 'Access module', 'implemented', 'critical', 'Legal/Engineering', 'medium', '["POPIA Art 18", "OWASP ASVS 1.4"]'),
('DATA-05', 'DATA_PRIVACY', 'ZK Proofs', 'Privacy-preserving verification using ZK proofs', 'Identity system', 'implemented', 'high', 'Engineering', 'medium', '["OWASP ASVS 1.4"]'),
('DATA-06', 'DATA_PRIVACY', 'POPIA DSAR', 'POPIA data subject request workflow', 'Compliance', 'missing', 'critical', 'Legal', 'critical', '["POPIA Art 14-22"]');

-- Set recommendations based on gaps
UPDATE security_controls SET 
  recommendation = 'Create VPC diagrams, firewall rules, and network policies'
WHERE control_id = 'INF-01' AND status = 'partial';

UPDATE security_controls SET 
  recommendation = 'Use KMS/vault for key storage instead of env files'
WHERE control_id = 'INF-02' AND status = 'partial';

UPDATE security_controls SET 
  recommendation = 'Implement key rotation schedule with automated key rollover'
WHERE control_id = 'INF-03' AND status = 'missing';

UPDATE security_controls SET 
  recommendation = 'Set up automated daily backups with quarterly restore drills'
WHERE control_id = 'INF-04' AND status = 'missing';

UPDATE security_controls SET 
  recommendation = 'Add token-based authentication for WebSocket connections'
WHERE control_id = 'INF-05' AND status = 'partial';

UPDATE security_controls SET 
  recommendation = 'Configure edge rate limiting for critical endpoints'
WHERE control_id = 'INF-06' AND status = 'partial';

UPDATE security_controls SET 
  recommendation = 'Implement dual approval for critical founder commands with step-up auth'
WHERE control_id = 'ORG-02' AND status = 'partial';

UPDATE security_controls SET 
  recommendation = 'Create incident response playbooks for key scenarios'
WHERE control_id = 'ORG-03' AND status = 'missing';

UPDATE security_controls SET 
  recommendation = 'Maintain vendor security register with annual reviews'
WHERE control_id = 'ORG-04' AND status = 'missing';

UPDATE security_controls SET 
  recommendation = 'Implement mandatory annual security awareness training'
WHERE control_id = 'ORG-05' AND status = 'missing';

UPDATE security_controls SET 
  recommendation = 'Add mandatory security review gate in PR process'
WHERE control_id = 'PROC-01' AND status = 'partial';

UPDATE security_controls SET 
  recommendation = 'Set up automated SCA scanning in CI/CD pipeline'
WHERE control_id = 'PROC-02' AND status = 'partial';

UPDATE security_controls SET 
  recommendation = 'Add secrets scanner to pre-commit and CI/CD'
WHERE control_id = 'PROC-03' AND status = 'missing';

UPDATE security_controls SET 
  recommendation = 'Define alert thresholds and SIEM integration'
WHERE control_id = 'PROC-04' AND status = 'partial';

UPDATE security_controls SET 
  recommendation = 'Run quarterly business logic abuse simulations'
WHERE control_id = 'PROC-05' AND status = 'missing';

UPDATE security_controls SET 
  recommendation = 'Implement DSAR tracking system with SLA monitoring'
WHERE control_id = 'DATA-06' AND status = 'missing';

COMMIT;
