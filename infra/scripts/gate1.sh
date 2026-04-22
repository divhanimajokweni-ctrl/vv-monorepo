#!/bin/bash
set -e

echo "🚪 GATE-1 Verification"
echo "====================="

# Check environment variables
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    exit 1
fi

echo "🔍 Checking database connectivity..."
# Test database connection
if ! npm run db:migrate --silent 2>/dev/null; then
    echo "❌ Cannot connect to database at $DATABASE_URL"
    exit 1
fi
echo "✅ Database connection successful"

echo "📊 Checking required tables..."

# Check pools table
POOL_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pools;" 2>/dev/null || echo "0")
if [ "$POOL_COUNT" -eq 0 ]; then
    echo "❌ Pools table is empty or does not exist"
    exit 1
fi
echo "✅ Pools table exists with $POOL_COUNT records"

# Check users table
USER_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
if [ "$USER_COUNT" -eq 0 ]; then
    echo "❌ Users table is empty or does not exist"
    exit 1
fi
echo "✅ Users table exists with $USER_COUNT records"

# Check pgvector extension
VECTOR_EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_extension WHERE extname = 'vector';" 2>/dev/null || echo "0")
if [ "$VECTOR_EXISTS" -eq 0 ]; then
    echo "❌ pgvector extension is not enabled"
    exit 1
fi
echo "✅ pgvector extension is enabled"

echo ""
echo "🎉 GATE-1 PASSED!"
echo "Core database infrastructure is ready."
echo ""
echo "Next: Deploy to Vercel and activate GATE-2"