#!/bin/bash
set -e

echo "🚪 GATE-2 Verification"
echo "====================="

# Check environment variables
if [ -z "$HEALTH_URL" ]; then
    echo "❌ HEALTH_URL environment variable is not set"
    echo "Set HEALTH_URL to your production API health endpoint"
    echo "Example: export HEALTH_URL=https://your-pools-api.vercel.app/api/health"
    exit 1
fi

echo "🏥 Checking production health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")

if [ "$HEALTH_RESPONSE" != "200" ]; then
    echo "❌ Health check failed with status $HEALTH_RESPONSE"
    echo "Expected 200 OK from $HEALTH_URL"
    exit 1
fi

echo "✅ Production API is healthy (status $HEALTH_RESPONSE)"

# Get health response body for additional checks
HEALTH_BODY=$(curl -s "$HEALTH_URL")
echo "📄 Health response: $HEALTH_BODY"

echo ""
echo "🎉 GATE-2 PASSED!"
echo "Production deployment is verified."
echo ""

echo "🚀 Executing waitlist import..."
if ! npm run db:seed -- --waitlist-import; then
    echo "❌ Waitlist import failed"
    exit 1
fi

echo "✅ Waitlist import completed"
echo ""
echo "🎊 All gates cleared! VV Monorepo is fully operational."