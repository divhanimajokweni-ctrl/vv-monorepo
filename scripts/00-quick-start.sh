#!/bin/bash
# File: scripts/00-quick-start.sh
# Copy-paste these commands to bootstrap everything

# Step 1: Clone and bootstrap
git clone https://github.com/divhanimajokweni-ctrl/vv-monorepo
cd vv-monorepo
bash scripts/01-bootstrap-repo.sh

# Step 2: Install dependencies
npm install

# Step 3: Generate test fixtures
npm run fixtures:generate

# Step 4: Start all local simulators
npx tsx packages/safekrypte/src/simulator.ts &
npx tsx packages/safestakes/src/simulator.ts &
npx tsx packages/mainframe/src/reporter-simulator.ts &
npx tsx packages/mainframe/src/metric-emitter.ts &

# Step 5: Run all tests
npm test

# Step 6: Run a replay
npm run replay -- --trace-id=test-trace-001

# Step 7: Run synthetic breach suite
npm run test:staging

# Step 8: Generate deployment attestation
npm run deploy:attest -- --env staging --artifact $(git rev-parse HEAD)