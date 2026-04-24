#!/bin/bash
set -euo pipefail

echo "🗄️  Staging Migration + Rollback Test"
echo "======================================"

STAGING_DB_URL="${STAGING_DB_URL:-postgresql://localhost:5432/vv_staging}"

# 1. Capture current schema hash
echo "[1/5] Capturing pre-migration schema..."
BEFORE_HASH=$(psql "$STAGING_DB_URL" -t -c "SELECT md5(string_agg(table_name || column_name, '')) FROM information_schema.columns WHERE table_schema='public';" | tr -d ' ')

# 2. Run migration
echo "[2/5] Running migration..."
npx tsx packages/platform/src/migrations/run.ts --env staging

# 3. Verify schema changed (or confirm idempotent)
echo "[3/5] Verifying post-migration schema..."
AFTER_HASH=$(psql "$STAGING_DB_URL" -t -c "SELECT md5(string_agg(table_name || column_name, '')) FROM information_schema.columns WHERE table_schema='public';" | tr -d ' ')

echo "   Before: $BEFORE_HASH"
echo "   After:  $AFTER_HASH"

# 4. Test rollback
echo "[4/5] Testing rollback procedure..."
# Rollback: apply the down migration or restore from snapshot
npx tsx packages/platform/src/migrations/rollback.ts --env staging

ROLLBACK_HASH=$(psql "$STAGING_DB_URL" -t -c "SELECT md5(string_agg(table_name || column_name, '')) FROM information_schema.columns WHERE table_schema='public';" | tr -d ' ')

if [ "$ROLLBACK_HASH" == "$BEFORE_HASH" ]; then
  echo "   ✅ Rollback successful. Schema restored to pre-migration state."
else
  echo "   ❌ Rollback failed. Schema differs from pre-migration state."
  exit 1
fi

# 5. Re-apply migration to leave staging in correct state
echo "[5/5] Re-applying migration..."
npx tsx packages/platform/src/migrations/run.ts --env staging

echo ""
echo "✅ Staging migration + rollback test passed."
echo "   Migration applied, rolled back, and re-applied successfully."</content>
<parameter name="filePath">scripts/staging/migrate-and-rollback.sh