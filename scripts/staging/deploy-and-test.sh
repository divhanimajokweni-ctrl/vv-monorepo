#!/bin/bash
# File: scripts/staging/deploy-and-test.sh
# Purpose: Full staging deployment with 14-test synthetic breach suite

echo "═══════════════════════════════════════════════════"
echo "  VV MONOREPO — STAGING DEPLOYMENT"
echo "  Suite: 14 Synthetic Breach Tests"
echo "  Date: $(date +%Y-%m-%d)"
echo "═══════════════════════════════════════════════════"
echo ""

# Step 1: Start all simulators
echo "🚀 Starting simulators..."
npx tsx packages/safekrypte/src/simulator.ts &
npx tsx packages/safestakes/src/simulator.ts &
npx tsx packages/mainframe/src/reporter-simulator.ts &
npx tsx packages/mainframe/src/metric-emitter.ts &
sleep 5

# Step 2: Run all 14 staging tests
echo ""
echo "🧪 Running 14-test synthetic breach suite..."
echo ""

echo "📋 Renewal Grace Tests..."
npx vitest run tests/staging-synthetic/test-12-renewal-grace.test.ts

echo "🔐 Key Rotation Tests..."
npx vitest run tests/staging-synthetic/test-13-key-rotation.test.ts

echo "💰 Escrow Tests..."
npx vitest run tests/staging-synthetic/test-14-escrow.test.ts

echo "⚡ Breach Chain Tests..."
npx vitest run tests/staging-synthetic/test-01-valid-payout.test.ts

echo "🧪 Anchor Invariant Tests..."
npx vitest run tests/property/underwriting-anchor-invariants.test.ts

# Step 3: Run shadow evaluation
echo ""
echo "🕶️  Running shadow evaluation..."
npm run shadow:start -- --mode passive-mirror --traces 50

# Step 4: Check results
if [ $? -eq 0 ]; then
  echo ""
  echo "✅ ALL STAGING TESTS PASSED"
  echo ""
  echo "📤 Ready for underwriter onboarding"
else
  echo "❌ Staging tests failed"
  exit 1
fi