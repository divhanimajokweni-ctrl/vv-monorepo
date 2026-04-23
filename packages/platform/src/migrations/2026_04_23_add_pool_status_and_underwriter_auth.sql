-- Migration: 2026_04_23_add_pool_status_and_underwriter_auth.sql
-- Adds database-level support for FK anchoring
-- Enables pool isolation and underwriter authorization

-- Add pool status and active policy hash
ALTER TABLE pools ADD COLUMN status ENUM('ACTIVE', 'PAUSED', 'UNCOVERED', 'CLOSED') NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE pools ADD COLUMN active_policy_hash VARCHAR(64) NULL;

-- Create underwriter authorization table
CREATE TABLE pool_underwriters (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pool_id VARCHAR(36) NOT NULL,
    underwriter_address VARCHAR(42) NOT NULL, -- Ethereum address format
    authorized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    authorized_by VARCHAR(42) NOT NULL,
    UNIQUE KEY unique_pool_underwriter (pool_id, underwriter_address),
    FOREIGN KEY (pool_id) REFERENCES pools(id) ON DELETE CASCADE
);

-- Create index for fast underwriter lookup
CREATE INDEX idx_pool_underwriters_pool ON pool_underwriters(pool_id);
CREATE INDEX idx_pool_underwriters_address ON pool_underwriters(underwriter_address);

-- Add trigger to prevent pool deletion with active coverage
DELIMITER ;;
CREATE TRIGGER prevent_active_pool_deletion
    BEFORE DELETE ON pools
    FOR EACH ROW
BEGIN
    IF OLD.status = 'ACTIVE' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot delete active pool with coverage';
    END IF;
END;;
DELIMITER ;

-- Insert initial authorized underwriters for pilot-pool-001
INSERT INTO pool_underwriters (pool_id, underwriter_address, authorized_by)
VALUES
    ('pilot-pool-001', '0xmock-underwriter-001', '0xsystem'),
    ('pilot-pool-001', '0xmock-underwriter-002', '0xsystem');

-- Update pilot pool with active policy
UPDATE pools SET active_policy_hash = '8f4e2d1a9b3c7f6e5d4a3b2c1d0e9f8a' WHERE id = 'pilot-pool-001';