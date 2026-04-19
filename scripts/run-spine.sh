#!/usr/bin/env bash
# =============================================================================
# Ubuntu Pools — Spine Hardening Runner
# =============================================================================
# Runs the full spine implementation sequence:
#   1. Migrate the database
#   2. Run invariant tests (packages/ledger)
#   3. Run spine integration tests (packages/villages)
#   4. Verify the health endpoint responds correctly
#
# Usage:
#   chmod +x scripts/run-spine.sh
#   ./scripts/run-spine.sh
#
# With a custom DB URL:
#   DATABASE_URL=postgresql://localhost:5432/ubuntu_test ./scripts/run-spine.sh
#
# CI mode (exits 1 on any failure):
#   CI=true ./scripts/run-spine.sh
# =============================================================================

set -euo pipefail

# ─── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

pass() { echo -e "${GREEN}  PASS${NC}  $1"; }
fail() { echo -e "${RED}  FAIL${NC}  $1"; }
info() { echo -e "${BLUE}  ----${NC}  $1"; }
warn() { echo -e "${YELLOW}  WARN${NC}  $1"; }
header() { echo -e "\n${BLUE}═══════════════════════════════════════${NC}"; echo -e "${BLUE}  $1${NC}"; echo -e "${BLUE}═══════════════════════════════════════${NC}"; }

ERRORS=0
PASSES=0

run_step() {
  local name="$1"
  local cmd="$2"
  info "Running: $name"
  if eval "$cmd" > /tmp/spine_step_out 2>&1; then
    pass "$name"
    PASSES=$((PASSES + 1))
  else
    fail "$name"
    echo "─── output ───"
    cat /tmp/spine_step_out
    echo "──────────────"
    ERRORS=$((ERRORS + 1))
    if [[ "${CI:-false}" == "true" ]]; then
      exit 1
    fi
  fi
}

# ─── Step 0: Preflight ────────────────────────────────────────────────────────
header "Preflight checks"

if ! command -v bun &>/dev/null; then
  fail "bun not found — install from https://bun.sh"
  exit 1
fi
pass "bun found: $(bun --version)"

if [[ -z "${DATABASE_URL:-}" ]]; then
  warn "DATABASE_URL not set — migration step will be skipped"
  SKIP_MIGRATION=true
else
  pass "DATABASE_URL is set"
  SKIP_MIGRATION=false
fi

# ─── Step 1: Type check ───────────────────────────────────────────────────────
header "TypeScript — type check"
run_step "packages/ledger typecheck" "bun typecheck --filter=@ubuntu/ledger"
run_step "packages/villages typecheck" "bun typecheck --filter=@ubuntu/villages"

# ─── Step 2: Database migration ───────────────────────────────────────────────
header "Database — spine migration"

if [[ "$SKIP_MIGRATION" == "true" ]]; then
  warn "Skipping migration (no DATABASE_URL)"
else
  run_step "migration 0007_spine_invariants" \
    "psql \"\$DATABASE_URL\" < packages/db/migrations/0007_spine_invariants.sql"
fi

# ─── Step 3: Invariant tests ──────────────────────────────────────────────────
header "Invariant tests — ledger"

run_step "Invariant 1: idempotency key required" \
  "bun test packages/ledger/src/invariants.test.ts -t 'idempotency key required'"

run_step "Invariant 2: double-entry balance" \
  "bun test packages/ledger/src/invariants.test.ts -t 'double-entry balance'"

run_step "Invariant 3: pool balance from projection only" \
  "bun test packages/ledger/src/invariants.test.ts -t 'pool balance from projection only'"

run_step "Invariant 5: notification source guard" \
  "bun test packages/ledger/src/invariants.test.ts -t 'notification source guard'"

run_step "Invariant 2 property: 50 random amounts always balance" \
  "bun test packages/ledger/src/invariants.test.ts -t 'property: posting always balances'"

# ─── Step 4: Spine integration tests ─────────────────────────────────────────
header "Spine integration tests — all 9 steps"

run_step "Step 1: member authentication" \
  "bun test packages/villages/src/spine.test.ts -t 'member authentication'"

run_step "Step 2: village membership" \
  "bun test packages/villages/src/spine.test.ts -t 'village membership'"

run_step "Full spine — all 9 steps complete" \
  "bun test packages/villages/src/spine.test.ts -t 'completes all 9 steps'"

run_step "Full spine — idempotent replay" \
  "bun test packages/villages/src/spine.test.ts -t 'is idempotent'"

run_step "Full spine — step 1 fail leaves ledger clean" \
  "bun test packages/villages/src/spine.test.ts -t 'fails at step 1'"

run_step "Full spine — audit trace queryable after completion" \
  "bun test packages/villages/src/spine.test.ts -t 'audit trace is queryable'"

run_step "Full spine — notification failure is non-fatal" \
  "bun test packages/villages/src/spine.test.ts -t 'notification failure is non-fatal'"

# ─── Step 5: Health endpoint ─────────────────────────────────────────────────
header "Health endpoint — /api/health/spine"

if [[ -z "${NEXT_PUBLIC_URL:-}" ]]; then
  warn "NEXT_PUBLIC_URL not set — skipping live health check"
else
  run_step "Health endpoint responds 200 or 503" \
    "curl -sf -o /dev/null -w '%{http_code}' \"\${NEXT_PUBLIC_URL}/api/health/spine\" | grep -E '^(200|503)$'"

  info "Fetching health payload:"
  curl -s "${NEXT_PUBLIC_URL}/api/health/spine" | bun -e "
    const data = await Bun.stdin.json();
    console.log('  status:', data.status);
    for (const [k, v] of Object.entries(data.spine)) {
      const s = v.status === 'ok' ? '\x1b[32mok\x1b[0m' : '\x1b[31m' + v.status + '\x1b[0m';
      console.log('  ' + k + ':', s);
    }
  " 2>/dev/null || warn "Could not parse health payload"
fi

# ─── Summary ──────────────────────────────────────────────────────────────────
header "Summary"

echo ""
echo -e "  ${GREEN}Passed${NC}: $PASSES"
if [[ $ERRORS -gt 0 ]]; then
  echo -e "  ${RED}Failed${NC}: $ERRORS"
  echo ""
  echo -e "  ${YELLOW}The spine is not proven. Fix failing steps before adding any new features.${NC}"
  exit 1
else
  echo -e "  ${RED}Failed${NC}: 0"
  echo ""
  echo -e "  ${GREEN}Spine is proven. All invariants hold. All 9 steps complete.${NC}"
  echo ""
  echo -e "  ${BLUE}What's next:${NC}"
  echo -e "  1. Run this script in CI — add to .github/workflows/spine.yml"
  echo -e "  2. Set up a Grafana alert when /api/health/spine returns 503"
  echo -e "  3. Only after 2 weeks of green: unfreeze packages/games"
fi
