### Thread 2 — The Lindiwe Signal Pipeline: The Architecture Gap to Close

Phase 14 wired game telemetry *to* Lindiwe. Phase 15 needs to define what Lindiwe *does with it*. The document describes the what (seven signals, three model branches) but the how is missing — and that gap is where Phase 15 actually lives. Here's what needs to be built:

**The missing CreditSignal output schema:**

The document says game signals feed Lindiwe's credit model, but never defines what a "credit signal" looks like as a TypeScript type that the credit service consumes. This is the critical interface contract. A defensible first version:

```typescript
interface CreditSignal {
  memberId: string;
  generatedAt: Date;
  source: 'game_telemetry' | 'contribution_history' | 'governance_activity';
  riskTier: 'conservative' | 'moderate' | 'growth';
  riskComponents: {
    riskAppetiteIndex: number;       // 0–100, from game telemetry
    overextensionScore: number;      // 0–100, from Market Maker + Credit Ladder
    stressResponsePattern: number;   // 0–100, from Pool Simulator
    contributionConsistency: number; // 0–100, from ledger history
  };
  creditRecommendation: {
    maxCreditLimit: number;          // ZAR, minor units
    recommendedProduct: 'buffer_loan' | 'microcredit' | 'growth_credit';
    confidence: number;              // 0–1, model certainty
    earlyWarningFlag: boolean;       // pre-default signal
  };
  sovereigntyMetadata: {
    consentVersion: string;
    derivedFrom: 'game_signals';     // never 'raw_game_events'
    erasable: boolean;
  };
}
```

This schema is what closes the loop from game behaviour to credit product. Without it, the signal pipeline is a data lake with no drain.

**The early warning mechanism:**

This is the most strategically valuable output Lindiwe can produce. The document states: "A member who repays on time but consistently overextends in the Market Maker sim is showing Lindiwe a pre-default signal that no ledger entry could ever reveal." That's a true and important claim — but it requires a *trigger threshold*. At what overextension score does Lindiwe fire a proactive counselling event? That threshold needs to be calibrated against real stokvel default data before being deployed, because a threshold set too sensitive generates false positives and erodes member trust in Lindiwe as a coaching tool.

**The backward-looking / forward-looking bridge:**

Lindiwe's current data is entirely backward-looking: contribution history, vote patterns, credit repayments. The game signals are forward-looking: they reveal decision-making psychology before it manifests in real events. The pipeline's real value is combining both. A member with excellent historical records but volatile game signals needs a *different* Lindiwe response than a member with mediocre history but stable, conservative game signals. The credit risk model needs to weight these appropriately — and that weighting should start conservative (heavy on history, light on game signals) and shift toward trusting game signals as validation data accumulates.