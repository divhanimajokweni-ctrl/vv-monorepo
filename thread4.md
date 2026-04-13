### Thread 4 — Phase 15 Build Plan: What to Actually Do

Based on the document's implementation notes and the gaps identified above, here is the grounded Phase 15 execution sequence:

**Step 1 — Run the scaffold, then immediately write the schema contracts (not just the migration).**

The scaffold creates `schema-games.ts` and the migration. After running it, the first engineering task is to write the TypeScript interface contracts for the three critical data boundaries: `GameTelemetryPayload` (what the game engine emits), `LindiweSignal` (what the telemetry processor outputs), and `CreditSignal` (what the credit service consumes). These three interfaces, written first, become the specification that all subsequent game logic must satisfy. Without them, game modules will be built to implicit assumptions that drift apart.

**Step 2 — Build Pool Simulator and Credit Ladder first, not Ubuntu Monopoly.**

Ubuntu Monopoly is the most ambitious game design (collectivised rent, property syndicates, voting on village fund). That complexity should come after the two games that generate the most operationally useful signals for Lindiwe. Pool Simulator generates Stress Response — the most directly applicable signal for governance role assessment. Credit Ladder generates Overextension and Knowledge Score — the most directly applicable signals for credit product recommendation. Ship these two working games with live telemetry before the others.

**Step 3 — Implement the early warning trigger before the credit product recommendation.**

The pedagogically safer Phase 15 output from Lindiwe is the early warning counselling pathway, not the credit product recommendation. The credit recommendation carries financial consequence and liability; the counselling pathway is purely additive and safe. Get the counselling pathway live, observe how game signals correlate with real member behaviour over 30–60 days, then calibrate the credit recommendation thresholds against observed data rather than estimated thresholds.

**Step 4 — Dodo Payments fallback design.**

The document marks Dodo Payments as the "exclusive financial backbone" with no fallback documented. South African payment rails include multiple options: Stitch (open banking, direct debit), PayFast, Peach Payments, and direct EFT via Netcash. The `BankProvider` adapter interface already exists in the codebase. A second adapter should be registered — even if not production-active — so that a Dodo Payments outage doesn't halt all financial operations. The `providers` registry pattern is already there; this is a matter of implementing the second adapter.

**Step 5 — WhatsApp rate limit strategy.**

The WhatsApp Business API enforces per-24-hour conversation windows and message template approval requirements. If Ubuntu Pools is using WhatsApp for community governance notifications (new proposals, voting reminders, pool shortfall alerts), these are all transactional messages that need pre-approved templates. The rate limiting architecture in the platform needs to be aware that WhatsApp is not an unlimited channel — bulk governance notifications should be batched and throttled, with a fallback to Resend email for members who hit their conversation window.