# AI Decision-Making Logic

## Core Decision Engine Architecture

Lindiwe AI implements a hierarchical decision-making system that balances multiple competing objectives: community protection, growth incentives, and behavioral intelligence. The system uses multi-factor analysis with confidence scoring and dual-validation safeguards.

### Decision Hierarchy

```
Emergency Mode (Highest Priority)
├── Buffer ratio < 10% AND anxiety > 70%
├── Immediate intervention required
└── Elder-only pools, maximum restrictions

Shield Mode (Protection Priority)
├── Buffer ratio < 25% AND anxiety > 50%
├── Tightened entry requirements
└── Community protection focus

Expansion Mode (Growth Priority)
├── Buffer ratio ≥ 100% AND stability > 70% AND anxiety < 30%
├── Lowered barriers for growth
└── Prosperity multipliers active

Maintenance Mode (Stability Priority)
├── Default state - no significant triggers
├── Current thresholds maintained
└── Steady state operation
```

### Multi-Factor Analysis Algorithm

```typescript
interface DecisionFactors {
  bufferRatio: number;        // Current buffer / target buffer
  anxiety: number;           // Community anxiety level (0-1)
  stability: number;         // Community stability level (0-1)
  excitement: number;        // Community excitement level (0-1)
  recentOutcomes: 'success' | 'failure' | 'mixed';
  activeMembers: number;
  defaultRate: number;
  contributionRate: number;
}

function analyzeDecisionFactors(factors: DecisionFactors): AnalysisResult {
  // Calculate emergency score (0-1)
  const emergencyScore = calculateEmergencyScore(factors);

  // Calculate shield score (0-1)
  const shieldScore = calculateShieldScore(factors);

  // Calculate expansion score (0-1)
  const expansionScore = calculateExpansionScore(factors);

  // Determine dominant decision pathway
  const maxScore = Math.max(emergencyScore, shieldScore, expansionScore);

  return {
    emergencyScore,
    shieldScore,
    expansionScore,
    dominantPathway: maxScore > 0.6 ? getPathwayName(maxScore) : 'maintenance',
    confidence: calculateOverallConfidence(factors, maxScore),
    riskFlags: identifyRiskFlags(factors)
  };
}
```

### Emergency Detection Algorithm

```typescript
function calculateEmergencyScore(factors: DecisionFactors): number {
  let score = 0;

  // Primary emergency triggers
  if (factors.bufferRatio < 0.1) score += 0.5;  // Critical buffer depletion
  if (factors.anxiety > 0.7) score += 0.4;     // High community anxiety
  if (factors.recentOutcomes === 'failure') score += 0.1;  // Recent failures

  // Secondary factors
  if (factors.defaultRate > 0.05) score += 0.2;    // High default rate
  if (factors.contributionRate < 0.7) score += 0.1; // Low contribution rate

  // Normalization and confidence adjustment
  const normalizedScore = Math.min(1, score);
  const confidence = normalizedScore > 0.8 ? 0.95 :
                    normalizedScore > 0.6 ? 0.9 : 0.8;

  return normalizedScore * confidence;
}
```

### Shield Activation Algorithm

```typescript
function calculateShieldScore(factors: DecisionFactors): number {
  let score = 0;

  // Primary shield triggers
  if (factors.bufferRatio < 0.25) score += 0.4;  // Buffer depletion
  if (factors.anxiety > 0.5) score += 0.3;      // Elevated anxiety
  if (factors.stability < 0.5) score += 0.2;    // Low stability

  // Risk accumulation factors
  if (factors.recentOutcomes === 'failure') score += 0.15;
  if (factors.defaultRate > 0.03) score += 0.15;

  // Community health factors
  if (factors.contributionRate < 0.8) score += 0.1;

  return Math.min(1, score);
}
```

### Expansion Opportunity Algorithm

```typescript
function calculateExpansionScore(factors: DecisionFactors): number {
  let score = 0;

  // Primary expansion triggers
  if (factors.bufferRatio >= 1.0) score += 0.4;   // Buffer thriving
  if (factors.stability > 0.7) score += 0.3;     // High stability
  if (factors.anxiety < 0.3) score += 0.2;       // Low anxiety

  // Growth momentum factors
  if (factors.excitement > 0.5) score += 0.15;   // High excitement
  if (factors.recentOutcomes === 'success') score += 0.15;
  if (factors.contributionRate > 0.9) score += 0.1;

  // Scale back if community is too small
  if (factors.activeMembers < 100) score *= 0.7;

  return Math.min(1, score);
}
```

## Dual-Validation Safeguards

### Confirmation Window Algorithm

```typescript
class DualValidationEngine {
  private pendingConfirmations: Map<string, PendingConfirmation> = new Map();
  private confirmationWindowMs: number = 30_000; // 30 seconds

  // Process decision with dual validation
  processDecision(
    decision: DecisionInput,
    analysis: AnalysisResult
  ): ValidationResult {
    const requiresValidation = this.requiresDualValidation(analysis);

    if (!requiresValidation) {
      return { validated: true, action: decision.action };
    }

    const confirmationId = this.generateConfirmationId();

    // Open confirmation window
    this.pendingConfirmations.set(confirmationId, {
      decision,
      analysis,
      requestedAt: new Date(),
      windowExpiresAt: new Date(Date.now() + this.confirmationWindowMs),
      status: 'pending'
    });

    // Return maintenance action during confirmation
    return {
      validated: false,
      confirmationId,
      action: 'maintain',
      reason: 'Awaiting dual validation',
      windowExpiresAt: new Date(Date.now() + this.confirmationWindowMs)
    };
  }

  // Confirm or reject pending decision
  resolveConfirmation(
    confirmationId: string,
    confirmed: boolean
  ): ResolutionResult {
    const pending = this.pendingConfirmations.get(confirmationId);

    if (!pending) {
      throw new Error('Confirmation not found');
    }

    if (Date.now() > pending.windowExpiresAt.getTime()) {
      // Confirmation window expired
      this.pendingConfirmations.delete(confirmationId);
      return { resolved: false, reason: 'confirmation_expired' };
    }

    if (confirmed) {
      // Execute the original decision
      this.pendingConfirmations.delete(confirmationId);
      return {
        resolved: true,
        action: pending.decision.action,
        dualValidated: true
      };
    } else {
      // Cancel the decision
      this.pendingConfirmations.delete(confirmationId);
      return {
        resolved: true,
        action: 'maintain',
        cancelled: true
      };
    }
  }

  private requiresDualValidation(analysis: AnalysisResult): boolean {
    // Require validation for significant changes
    return analysis.emergencyScore > 0.7 ||
           analysis.shieldScore > 0.8 ||
           analysis.expansionScore > 0.8;
  }
}
```

## Adaptive Learning Algorithms

### Weight Adjustment Algorithm

```typescript
interface LearningWeights {
  buffer_weight: number;     // Safety buffer importance (0.35 default)
  pulse_weight: number;      // Community sentiment importance (0.25 default)
  member_weight: number;     // Individual behavior importance (0.25 default)
  outcome_weight: number;    // Recent performance importance (0.15 default)
}

class AdaptiveLearningEngine {
  private weights: LearningWeights = {
    buffer_weight: 0.35,
    pulse_weight: 0.25,
    member_weight: 0.25,
    outcome_weight: 0.15
  };

  // Learn from decision outcomes
  learnFromOutcome(
    decision: DecisionInput,
    outcome: 'success' | 'failure',
    context: string
  ): void {
    const weightKey = this.mapContextToWeight(context);
    const currentWeight = this.weights[weightKey];

    // Adjust weight based on outcome
    const adjustment = outcome === 'success' ? 0.02 : -0.02;
    const newWeight = Math.max(0.1, Math.min(0.5, currentWeight + adjustment));

    this.weights[weightKey] = newWeight;

    // Normalize weights to ensure they sum to 1
    this.normalizeWeights();
  }

  private mapContextToWeight(context: string): keyof LearningWeights {
    const contextMap = {
      'buffer_health': 'buffer_weight',
      'community_pulse': 'pulse_weight',
      'member_behavior': 'member_weight',
      'recent_performance': 'outcome_weight'
    };

    return contextMap[context] || 'buffer_weight';
  }

  private normalizeWeights(): void {
    const total = Object.values(this.weights).reduce((sum, w) => sum + w, 0);
    Object.keys(this.weights).forEach(key => {
      this.weights[key as keyof LearningWeights] /= total;
    });
  }
}
```

## Confidence Scoring Algorithms

### Overall Confidence Calculation

```typescript
function calculateOverallConfidence(
  factors: DecisionFactors,
  decisionScore: number
): number {
  // Base confidence from decision strength
  let confidence = decisionScore;

  // Adjust based on data quality
  const dataQualityMultiplier = calculateDataQualityMultiplier(factors);

  // Adjust based on historical accuracy
  const historicalAccuracyMultiplier = calculateHistoricalAccuracyMultiplier();

  // Adjust based on external factors
  const externalFactorsMultiplier = calculateExternalFactorsMultiplier(factors);

  confidence *= dataQualityMultiplier;
  confidence *= historicalAccuracyMultiplier;
  confidence *= externalFactorsMultiplier;

  return Math.max(0.1, Math.min(1.0, confidence));
}

function calculateDataQualityMultiplier(factors: DecisionFactors): number {
  let multiplier = 1.0;

  // Recent data is more reliable
  const recentDataRatio = factors.activeMembers > 1000 ? 1.0 :
                         factors.activeMembers > 100 ? 0.9 : 0.8;

  // Diverse data sources increase confidence
  const dataDiversity = (factors.recentOutcomes !== 'mixed' ? 0.1 : 0) +
                       (factors.contributionRate > 0 ? 0.1 : 0) +
                       (factors.defaultRate >= 0 ? 0.1 : 0);

  multiplier *= recentDataRatio;
  multiplier *= (1 + dataDiversity);

  return multiplier;
}
```

## Risk Flag Identification

### Automated Risk Assessment

```typescript
function identifyRiskFlags(factors: DecisionFactors): RiskFlag[] {
  const flags: RiskFlag[] = [];

  // Critical buffer risk
  if (factors.bufferRatio < 0.1) {
    flags.push({
      type: 'CRITICAL_BUFFER',
      severity: 'critical',
      description: 'Buffer below 10% - immediate intervention required'
    });
  }

  // High anxiety risk
  if (factors.anxiety > 0.7) {
    flags.push({
      type: 'HIGH_ANXIETY',
      severity: 'high',
      description: 'Community anxiety above 70% - stress signals detected'
    });
  }

  // Stability risk
  if (factors.stability < 0.3) {
    flags.push({
      type: 'LOW_STABILITY',
      severity: 'medium',
      description: 'Community stability below 30% - volatility detected'
    });
  }

  // Default rate risk
  if (factors.defaultRate > 0.05) {
    flags.push({
      type: 'HIGH_DEFAULT_RATE',
      severity: 'high',
      description: 'Default rate above 5% - credit quality concerns'
    });
  }

  // Recent failure risk
  if (factors.recentOutcomes === 'failure') {
    flags.push({
      type: 'RECENT_FAILURES',
      severity: 'medium',
      description: 'Recent pool outcomes predominantly negative'
    });
  }

  return flags;
}
```

This decision-making logic demonstrates how Lindiwe AI balances multiple objectives while maintaining transparency, adaptability, and system safety through sophisticated algorithms and validation mechanisms.