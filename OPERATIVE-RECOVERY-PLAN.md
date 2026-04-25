# VV Monorepo: Upper-Tier Operative Recovery
## Date: 2026-04-25 | Status: DEPLOYMENT BLOCKED (Correctly)

---

## THE REAL DIAGNOSIS

The previous strategy document contained a critical framing error:
it treated this as a "build pipeline problem" when it is actually
an "audit integrity problem." The build passes. The deployment gate
works. But the gate was silently bypassed by a write-overwrite race.

### What Actually Happened

```
Run 1 (passive-mirror, 50 traces):  20 divergences → wrote "20" to count file
Run 2 (clean conditions, 50 traces): 0 divergences → wrote "0" → OVERWROTE
Run 3 (clean conditions, 50 traces): 0 divergences → wrote "0" → OVERWROTE
CI/CD reads count file: sees "0" → gate clears → would deploy corrupted system
```

The DEPLOYMENT_BLOCKED sentinel exists as proof the system correctly
detected the problem. Someone (or a script) reset the count file.
That reset is the breach.

---

## CRITICAL FIXES (ordered by severity)

### FIX 1 — Audit Layer (BLOCKER, must ship first)
**File:** `tools/shadow-evaluator/src/index.ts`
**Change:** Replace `writeFile(count)` with `appendFile(run-manifest.jsonl)`
**Why:** The write-overwrite pattern is the root cause. A single-file
         append log is immutable by design — you can only add, never erase.

### FIX 2 — Deployment Gate (BLOCKER, ships with Fix 1)
**File:** `scripts/ops/reconcile-audit.ts` (new file — provided in this package)
**Change:** CI/CD calls THIS, not the evaluator directly.
**Why:** Separates evaluation (produces data) from gating (reads data).
         The evaluator should never be the source of its own pass/fail signal.

### FIX 3 — Dead Code Elimination (HIGH, ships next)
**File:** `packages/dashboard/src/UnifiedDashboard.tsx`
**Change:** Delete the three placeholder page functions (last ~35 lines)
**Why:** TypeScript picks the last declaration. Enhanced UI is dead code today.

### FIX 4 — Shadow Mock Removal (HIGH, ships with Fix 1)
**File:** `tools/shadow-evaluator/src/index.ts` → `liveEvaluator()`
**Change:** Remove `allowed: true` mock. Accept real live outcome from caller.
**Why:** The current mock creates artificial agreement in batches 2-3,
         masking what would have been additional divergences.

### FIX 5 — executeSlash Invariant 10 (MEDIUM, next sprint)
**File:** `packages/safestakes/src/core/executeSlash.ts`
**Issue:** Invariant 10 tests in `underwriting-anchor-invariants.test.ts`
           only tests the anchor function. The full `executeSlash` path
           (gates 0-10) has no property tests covering gate interactions.
           A gate 6 bypass (wrong incidentType) could pass gates 1-5.

---

## EXECUTION SEQUENCE (Today)

```bash
# Step 1: Restore audit integrity
cp vv-recovery/reconcile-audit.ts scripts/ops/reconcile-audit.ts
# Apply shadow evaluator fix (see shadow-evaluator-fix.patch)

# Step 2: Verify the fix catches the historical divergences
tsx scripts/ops/reconcile-audit.ts shadow-results/results.jsonl 720
# Expected output: DEPLOYMENT BLOCKED (catches the 20 batch-1 divergences)
# 720h window = 30 days, captures all historical runs

# Step 3: Fix the dashboard dead code (surgical delete, no logic changes)
# Delete the placeholder versions of the 3 page components

# Step 4: Run full test suite against the REAL evaluator (no mocks)
npm test
# All 10 anchor invariants must pass (they currently do)

# Step 5: Run shadow evaluation with fixed evaluator
npx tsx tools/shadow-evaluator/src/index.ts --mode passive-mirror --traces 50
# New run with real live outcomes (not mocked)

# Step 6: Run reconcile-audit BEFORE any deploy decision
tsx scripts/ops/reconcile-audit.ts shadow-results/results.jsonl 1
# 1h window = only the fresh run above
# If clean: gate clears
# If not: investigate the specific diverging incidentTypes

# Step 7: Update CI/CD pipeline
# Replace: run: echo $(cat shadow-results/divergence-count.txt)
# With:    run: tsx scripts/ops/reconcile-audit.ts shadow-results/results.jsonl 1
```

---

## UNDERWRITER CONFIDENCE RESTORATION

Once the audit layer is clean, generate this attestation:

```typescript
const attestation = {
  date: '2026-04-25',
  auditWindowH: 24,
  totalEvaluated: 50,           // fresh run only
  trueDivergenceCount: 0,       // verified by reconcile-audit.ts
  sourceFile: 'shadow-results/results.jsonl',
  reconcileScript: 'scripts/ops/reconcile-audit.ts',
  methodology: 'append-only audit log, external gate script',
  signedBy: 'safekrypte-admin-key',
};
```

This is what you show an underwriter. Not the deployment report.
The deployment report describes *effort*. The attestation describes *proof*.

---

## WHAT THE PREVIOUS STRATEGY GOT RIGHT

- Node 24 environment mandate: correct
- Strict type-checking gate: correct  
- SafeKrypte ceremony verification: correct
- Zero-knowledge build approach: correct

## WHAT THE PREVIOUS STRATEGY MISSED

- The audit layer was already compromised before any pipeline changes
- "Run irrevocable-debug.sh" addresses package.json issues that don't
  exist in this codebase — wrong repo context was applied
- "5-Table Schema Lock" references `packages/villages/src` which 
  doesn't exist in vv-monorepo — that's a different project's context
- Calling this a "sonographer's diagnostic" understates severity:
  this is an audit falsification, not a scan reading

---

## LIVING APPLICATION (Phase 3 of First Principles)

The code principle here maps directly to life principle:

**In code:** A counter that overwrites itself is not a counter.
             It's a reset button wearing a counter's clothes.
             Every system that measures its own health this way
             will trend toward reporting health, not achieving it.

**In life:** The metric you track must be structurally impossible
             to game. Weight, finances, relationships — if the
             measurement system can be reset by the thing being
             measured, you don't have accountability.
             You have theater.

The fix isn't discipline. It's architecture.
Make it structurally impossible to overwrite the count.
Append-only. Externally reconciled. Signed.

That's what an immutable audit log is.
That's what a non-negotiable commitment is.
Same pattern. Different layer.
