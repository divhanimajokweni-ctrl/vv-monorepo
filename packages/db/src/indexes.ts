/**
 * Ubuntu Pools — Database Indexes Documentation
 * 
 * Additional indexes to add via migration for query optimization
 * 
 * Run: bun run db:generate && bun run db:migrate
 * 
 * Or execute SQL directly:
 */

export const ADDITIONAL_INDEXES_SQL = `
-- Events table indexes
CREATE INDEX IF NOT EXISTS idx_events_occurred_at_desc ON events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_status_occurred ON events (status, occurred_at);

-- Journal entries indexes  
CREATE INDEX IF NOT EXISTS idx_journal_entries_account_currency ON journal_entries (account_id, currency);
CREATE INDEX IF NOT EXISTS idx_journal_entries_posted_account ON journal_entries (posted_at, account_id DESC);

-- Credit loans indexes
CREATE INDEX IF NOT EXISTS idx_credit_loans_status_issued ON credit_loans (status, issued_at);
CREATE INDEX IF NOT EXISTS idx_credit_loans_member_status ON credit_loans (member_id, status);
CREATE INDEX IF NOT EXISTS idx_credit_loans_pool_status ON credit_loans (pool_id, status);

-- Member credit profile indexes
CREATE INDEX IF NOT EXISTS idx_member_credit_profile_lookup ON member_credit_profile (member_id, pool_id);
CREATE INDEX IF NOT EXISTS idx_member_credit_eligible_pool ON member_credit_profile (credit_eligible, pool_id);

-- Credit payments indexes
CREATE INDEX IF NOT EXISTS idx_credit_payments_loan_paid ON credit_payments (loan_id, paid_at);
CREATE INDEX IF NOT EXISTS idx_credit_payments_member_paid ON credit_payments (member_id, paid_at);
`;

export const RECOMMENDED_QUERIES_TO_OPTIMIZE = [
  'SELECT * FROM events ORDER BY occurred_at DESC LIMIT 100',
  'SELECT * FROM events WHERE status = $1 AND occurred_at > $2',
  'SELECT SUM(amount) FROM journal_entries WHERE account_id = $1 AND posted_at > $2',
  'SELECT * FROM credit_loans WHERE member_id = $1 AND status IN ($2, $3)',
  'SELECT * FROM member_credit_profile WHERE credit_eligible = true AND pool_id = $1',
];
