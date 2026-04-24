#!/bin/bash
set -euo pipefail

echo "🚀 Venture Vision Ubuntu Production Deployment"
echo "=============================================="

# Check prerequisites
echo "[1/8] Checking prerequisites..."

if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install with: npm i -g vercel"
    exit 1
fi

if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Install Node.js."
    exit 1
fi

if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found."
    exit 1
fi

echo "✅ Prerequisites met"

# Check environment variables
echo "[2/8] Validating environment variables..."
source .env.production

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set in .env.production"
    exit 1
fi

if [ -z "$SUPABASE_URL" ]; then
    echo "❌ SUPABASE_URL not set in .env.production"
    exit 1
fi

echo "✅ Environment variables validated"

# Run final checks
echo "[3/8] Running final pre-deployment checks..."

# Check for placeholders
if grep -r "0xplaceholder" packages/ tools/ scripts/ --include="*.ts" --include="*.js" >/dev/null 2>&1; then
    echo "❌ Placeholder values still exist in codebase"
    exit 1
fi

# Run typecheck
npx turbo run typecheck

# Run lint
npx turbo run lint

# Run tests
npm test

echo "✅ All checks passed"

# Deploy API
echo "[4/8] Deploying SafeKrypte API..."
cd packages/api

# Set environment variables for Vercel
vercel env pull .env.production 2>/dev/null || true

# Deploy
API_URL=$(vercel --prod --yes 2>&1 | grep -o 'https://[^ ]*')

if [ -z "$API_URL" ]; then
    echo "❌ API deployment failed"
    exit 1
fi

echo "✅ API deployed at: $API_URL"

cd ../..

# Deploy Dashboard (if it exists)
echo "[5/8] Deploying Lindiwe Dashboard..."
if [ -d "packages/dashboard" ]; then
    cd packages/dashboard
    DASHBOARD_URL=$(vercel --prod --yes 2>&1 | grep -o 'https://[^ ]*')
    if [ -z "$DASHBOARD_URL" ]; then
        echo "⚠️  Dashboard deployment failed, continuing..."
        DASHBOARD_URL="https://venturevisionubuntu.vercel.app"
    else
        echo "✅ Dashboard deployed at: $DASHBOARD_URL"
    fi
    cd ../..
else
    echo "⚠️  No dashboard package found, skipping..."
    DASHBOARD_URL="https://venturevisionubuntu.vercel.app"
fi

# Run database migration
echo "[6/8] Running production database migration..."
npx tsx packages/platform/src/migrations/run.ts --env production

echo "✅ Database migration completed"

# Smoke tests
echo "[7/8] Running production smoke tests..."

# Test health endpoint
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/health")
if [ "$HEALTH_RESPONSE" != "200" ]; then
    echo "❌ Health check failed with status: $HEALTH_RESPONSE"
    exit 1
fi

echo "✅ Health check passed"

# Test sign endpoint (with dummy data)
SIGN_RESPONSE=$(curl -s -X POST "${API_URL}/sign" \
    -H "Content-Type: application/json" \
    -d '{"payload":{"test":"data"},"keyId":"safe-stakes-executor-key"}')

if echo "$SIGN_RESPONSE" | grep -q "signature"; then
    echo "✅ Sign endpoint functional"
else
    echo "❌ Sign endpoint failed: $SIGN_RESPONSE"
    exit 1
fi

echo "✅ All smoke tests passed"

# Final setup
echo "[8/8] Final production setup..."

# Create deployment record
DEPLOYMENT_RECORD="{
  \"deploymentId\": \"prod-$(date +%s)\",
  \"timestamp\": \"$(date -Iseconds)\",
  \"apiUrl\": \"$API_URL\",
  \"dashboardUrl\": \"$DASHBOARD_URL\",
  \"version\": \"${DEPLOYMENT_VERSION:-1.0.0}\",
  \"environment\": \"production\"
}"

echo "$DEPLOYMENT_RECORD" > deployment-record.json

echo ""
echo "🎉 PRODUCTION DEPLOYMENT COMPLETE!"
echo "=================================="
echo "API Endpoint: $API_URL"
echo "Dashboard: $DASHBOARD_URL"
echo "Health Check: $API_URL/health"
echo ""
echo "Next steps:"
echo "1. Configure custom domain in Vercel dashboard"
echo "2. Update DNS records to point to Vercel"
echo "3. Notify UBUNTUctrl Committee of live deployment"
echo "4. Begin underwriter onboarding process"
echo ""
echo "🚀 Venture Vision Ubuntu is now live in production!"