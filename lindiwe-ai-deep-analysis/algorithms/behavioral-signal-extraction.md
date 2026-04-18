# Behavioral Signal Extraction Algorithms

## Game-Based Behavioral Intelligence

Lindiwe AI extracts sophisticated behavioral signals from Ubuntu Pools' eight financial games, transforming gameplay decisions into credit intelligence and governance insights. Each game targets specific financial concepts while generating derived signals for behavioral analysis.

### Signal Extraction Framework

```typescript
interface BehaviouralSignal {
  type: SignalType;
  value: number;        // 0-100 scale
  confidence: number;   // Extraction confidence 0-100
  gameId: GameId;       // Source game
  rationale: string;    // Human-readable explanation
}

type SignalExtractor = (state: GameState) => BehaviouralSignal[];
```

## Ubuntu Monopoly - Cooperative Intelligence

### Game Overview
Ubuntu Monopoly simulates community property ownership and collective decision-making, targeting concepts of cooperation vs competition and long-term community planning.

### Signal Extraction Algorithm

```typescript
function extractUbuntuMonopolySignals(state: GameState): BehaviouralSignal[] {
  const decisions = state.decisions ?? [];
  const total = decisions.length || 1;

  // Cooperative actions: syndicate formations and community investments
  const syndicateFormations = decisions.filter(d =>
    d.type === 'form_syndicate').length;

  const communityInvestments = decisions.filter(d =>
    d.type === 'fund_village').length;

  const cooperativeTotal = syndicateFormations + communityInvestments;

  // Competitive actions: blocking acquisitions and monopolistic behavior
  const blockingAcquisitions = decisions.filter(d =>
    d.type === 'acquire_to_block').length;

  return [
    {
      type: 'cooperative_quotient',
      value: Math.round((cooperativeTotal / total) * 100),
      confidence: Math.min(90, total * 5),
      gameId: 'ubuntu_monopoly',
      rationale: `${syndicateFormations} syndicate formations, ${communityInvestments} village fund contributions out of ${total} decisions`
    },
    {
      type: 'risk_appetite',
      value: Math.round((blockingAcquisitions / total) * 100),
      confidence: Math.min(80, total * 4),
      gameId: 'ubuntu_monopoly',
      rationale: `${blockingAcquisitions} blocking acquisitions indicating competitive vs cooperative orientation`
    }
  ];
}
```

**Signal Meanings:**
- **Cooperative Quotient**: Measures willingness to collaborate and invest in community welfare
- **Risk Appetite**: Assesses competitive vs cooperative strategic orientation

## Pool Simulator - Crisis Management Intelligence

### Game Overview
Pool Simulator challenges players to manage community savings pools during stress periods, targeting crisis response and leadership under pressure.

### Signal Extraction Algorithm

```typescript
function extractPoolSimulatorSignals(state: GameState): BehaviouralSignal[] {
  const decisions = state.decisions ?? [];
  const total = decisions.length || 1;

  // Compassion vs rigidity under stress
  const extensions = decisions.filter(d => d.type === 'grant_extension').length;
  const enforcements = decisions.filter(d => d.type === 'enforce_default').length;

  // Leadership and mediation skills
  const mediations = decisions.filter(d =>
    d.outcome === 'positive' && d.type.startsWith('mediate')).length;

  // Conservative resource management
  const bufferDraws = decisions.filter(d => d.type === 'draw_buffer').length;

  return [
    {
      type: 'stress_response',
      value: Math.round((extensions / (extensions + enforcements + 1)) * 100),
      confidence: Math.min(95, total * 8),
      gameId: 'pool_simulator',
      rationale: `${extensions} extensions vs ${enforcements} enforcements under pool stress`
    },
    {
      type: 'leadership_index',
      value: Math.round((mediations / total) * 100 + (bufferDraws < 3 ? 20 : 0)),
      confidence: Math.min(85, total * 7),
      gameId: 'pool_simulator',
      rationale: `${mediations} successful mediations, ${bufferDraws} buffer draws (conservative = higher score)`
    }
  ];
}
```

**Signal Meanings:**
- **Stress Response**: Measures empathy and flexibility during financial crises
- **Leadership Index**: Evaluates mediation skills and prudent resource management

## Credit Ladder - Overextension Risk Intelligence

### Game Overview
Credit Ladder simulates credit building and debt management, targeting responsible borrowing patterns and long-term financial planning.

### Signal Extraction Algorithm

```typescript
function extractCreditLadderSignals(state: GameState): BehaviouralSignal[] {
  const decisions = state.decisions ?? [];
  const total = decisions.length || 1;

  // Overextension detection
  const overextensions = decisions.filter(d =>
    d.type === 'take_loan' && d.outcome === 'negative').length;

  // Repayment discipline
  const earlyRepayments = decisions.filter(d =>
    d.type === 'early_repayment').length;

  const minimumPayments = decisions.filter(d =>
    d.type === 'minimum_payment').length;

  return [
    {
      type: 'overextension',
      value: Math.round((overextensions / total) * 100),
      confidence: 85,
      gameId: 'credit_ladder',
      rationale: `${overextensions} overextension events in ${total} turns`
    },
    {
      type: 'risk_appetite',
      value: 100 - Math.round((earlyRepayments / total) * 100),
      confidence: 80,
      gameId: 'credit_ladder',
      rationale: `${earlyRepayments} early repayments vs ${minimumPayments} minimum payments`
    }
  ];
}
```

**Signal Meanings:**
- **Overextension**: Measures tendency to take on unsustainable debt
- **Risk Appetite**: Assesses borrowing discipline and payment prioritization

## The Commons - Resource Sharing Intelligence

### Game Overview
The Commons implements the classic tragedy of the commons scenario, targeting sustainable resource management and collective action problems.

### Signal Extraction Algorithm

```typescript
function extractCommonsSignals(state: GameState): BehaviouralSignal[] {
  const decisions = state.decisions ?? [];
  const total = decisions.length || 1;

  // Sustainable choices
  const restrained = decisions.filter(d => d.choice === 'take_less').length;
  const defected = decisions.filter(d => d.choice === 'take_max').length;

  // Long-term thinking
  const planningDecisions = decisions.filter(d =>
    d.reasoning?.includes('future') || d.reasoning?.includes('sustainable')).length;

  return [
    {
      type: 'cooperative_quotient',
      value: Math.round((restrained / total) * 100),
      confidence: Math.min(90, total * 6),
      gameId: 'the_commons',
      rationale: `${restrained} sustainable choices vs ${defected} overconsumption decisions`
    },
    {
      type: 'planning_horizon',
      value: Math.round((planningDecisions / total) * 100),
      confidence: Math.min(75, total * 5),
      gameId: 'the_commons',
      rationale: `${planningDecisions} decisions considering long-term sustainability`
    }
  ];
}
```

## Market Maker - Trading Psychology Intelligence

### Game Overview
Market Maker simulates financial market participation, targeting trading psychology and market timing decisions.

### Signal Extraction Algorithm

```typescript
function extractMarketMakerSignals(state: GameState): BehaviouralSignal[] {
  const decisions = state.decisions ?? [];
  const total = decisions.length || 1;

  // Market timing and momentum
  const momentumTrades = decisions.filter(d =>
    d.type === 'momentum_trade').length;

  const contrarianTrades = decisions.filter(d =>
    d.type === 'contrarian_trade').length;

  // Risk management
  const stopLosses = decisions.filter(d =>
    d.type === 'set_stop_loss').length;

  const positionSizing = decisions.filter(d =>
    d.outcome === 'positive' && d.type === 'position_size').length;

  return [
    {
      type: 'risk_appetite',
      value: Math.round((momentumTrades / total) * 100),
      confidence: Math.min(85, total * 6),
      gameId: 'market_maker',
      rationale: `${momentumTrades} momentum trades vs ${contrarianTrades} contrarian positions`
    },
    {
      type: 'planning_horizon',
      value: Math.round(((stopLosses + positionSizing) / total) * 100),
      confidence: Math.min(80, total * 5),
      gameId: 'market_maker',
      rationale: `${stopLosses} stop losses set, ${positionSizing} optimal position sizes`
    }
  ];
}
```

## Lottery Scenario - Impulse Control Intelligence

### Game Overview
Lottery Scenario presents randomized reward opportunities, targeting impulse control and probabilistic thinking.

### Signal Extraction Algorithm

```typescript
function extractLotterySignals(state: GameState): BehaviouralSignal[] {
  const decisions = state.decisions ?? [];
  const total = decisions.length || 1;

  // Impulse control
  const resisted = decisions.filter(d => d.choice === 'pass').length;
  const gambled = decisions.filter(d => d.choice === 'gamble').length;

  // Decision speed analysis
  const quickDecisions = decisions.filter(d =>
    d.timestamp && (Date.now() - d.timestamp) < 3000).length;

  return [
    {
      type: 'impulse_index',
      value: 100 - Math.round((resisted / total) * 100),
      confidence: Math.min(90, total * 7),
      gameId: 'lottery_scenario',
      rationale: `${resisted} resisted vs ${gambled} gambled on lottery opportunities`
    },
    {
      type: 'decision_speed',
      value: Math.round((quickDecisions / total) * 100),
      confidence: Math.min(85, total * 6),
      gameId: 'lottery_scenario',
      rationale: `${quickDecisions} decisions made in under 3 seconds`
    }
  ];
}
```

## Dice Strategy - Risk Calculation Intelligence

### Game Overview
Dice Strategy involves probabilistic decision-making with known odds, targeting risk assessment and mathematical thinking.

### Signal Extraction Algorithm

```typescript
function extractDiceSignals(state: GameState): BehaviouralSignal[] {
  const decisions = state.decisions ?? [];
  const total = decisions.length || 1;

  // Risk calculation accuracy
  const optimalBets = decisions.filter(d =>
    d.outcome === 'positive' && d.type === 'calculated_bet').length;

  const suboptimalBets = decisions.filter(d =>
    d.outcome === 'negative' && d.type === 'emotional_bet').length;

  // Learning adaptation
  const strategyAdjustments = decisions.filter(d =>
    d.reasoning?.includes('learned') || d.reasoning?.includes('adjusted')).length;

  return [
    {
      type: 'knowledge_score',
      value: Math.round((optimalBets / total) * 100),
      confidence: Math.min(95, total * 8),
      gameId: 'dice_strategy',
      rationale: `${optimalBets} mathematically optimal decisions out of ${total}`
    },
    {
      type: 'planning_horizon',
      value: Math.round((strategyAdjustments / total) * 100),
      confidence: Math.min(80, total * 6),
      gameId: 'dice_strategy',
      rationale: `${strategyAdjustments} strategy adjustments based on learning`
    }
  ];
}
```

## Crop Finance - Seasonal Planning Intelligence

### Game Overview
Crop Finance simulates agricultural credit cycles, targeting seasonal planning and cash flow management.

### Signal Extraction Algorithm

```typescript
function extractCropFinanceSignals(state: GameState): BehaviouralSignal[] {
  const decisions = state.decisions ?? [];
  const total = decisions.length || 1;

  // Seasonal planning
  const preSeasonPrep = decisions.filter(d =>
    d.type === 'seasonal_prep').length;

  const reactivePurchases = decisions.filter(d =>
    d.type === 'emergency_buy').length;

  // Cash flow management
  const debtManagement = decisions.filter(d =>
    d.outcome === 'positive' && d.type === 'debt_restructure').length;

  const overleveraging = decisions.filter(d =>
    d.outcome === 'negative' && d.type === 'excess_borrowing').length;

  return [
    {
      type: 'planning_horizon',
      value: Math.round((preSeasonPrep / total) * 100),
      confidence: Math.min(90, total * 7),
      gameId: 'crop_finance',
      rationale: `${preSeasonPrep} proactive preparations vs ${reactivePurchases} reactive decisions`
    },
    {
      type: 'overextension',
      value: Math.round((overleveraging / total) * 100),
      confidence: Math.min(85, total * 6),
      gameId: 'crop_finance',
      rationale: `${overleveraging} over-leveraging events in seasonal cycles`
    }
  ];
}
```

## Signal Aggregation and Intelligence

### Multi-Game Signal Synthesis

```typescript
function synthesizeBehavioralProfile(
  gameSignals: BehaviouralSignal[]
): SynthesizedProfile {
  // Group signals by type across all games
  const signalGroups = gameSignals.reduce((groups, signal) => {
    if (!groups[signal.type]) groups[signal.type] = [];
    groups[signal.type].push(signal);
    return groups;
  }, {} as Record<SignalType, BehaviouralSignal[]>);

  // Calculate weighted averages with confidence
  const profile = {} as SynthesizedProfile;

  for (const [signalType, signals] of Object.entries(signalGroups)) {
    const totalWeight = signals.reduce((sum, s) => sum + s.confidence, 0);
    const weightedValue = signals.reduce((sum, s) =>
      sum + (s.value * s.confidence), 0) / totalWeight;

    profile[signalType as SignalType] = {
      value: Math.round(weightedValue),
      confidence: Math.min(100, totalWeight / signals.length),
      sources: signals.length,
      consistency: calculateSignalConsistency(signals)
    };
  }

  return profile;
}

function calculateSignalConsistency(signals: BehaviouralSignal[]): number {
  if (signals.length < 2) return 100;

  const values = signals.map(s => s.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Convert to consistency score (0-100)
  return Math.max(0, Math.min(100, 100 - (stdDev * 2)));
}
```

## Behavioral Intelligence Applications

### Credit Risk Assessment

```typescript
function generateCreditInsights(profile: SynthesizedProfile): CreditInsights {
  const riskFactors = [];

  // High overextension = higher risk
  if (profile.overextension?.value > 70) {
    riskFactors.push('High overextension risk detected');
  }

  // Low cooperative quotient = relationship risk
  if (profile.cooperative_quotient?.value < 30) {
    riskFactors.push('Low community cooperation indicators');
  }

  // High impulse index = behavioral risk
  if (profile.impulse_index?.value > 80) {
    riskFactors.push('High impulse control concerns');
  }

  // Calculate overall risk tier
  const riskScore = calculateRiskScore(profile);
  const riskTier = riskScore < 30 ? 'conservative' :
                   riskScore < 60 ? 'moderate' : 'growth';

  return {
    riskTier,
    riskScore,
    riskFactors,
    recommendedProducts: recommendCreditProducts(riskTier, profile),
    behavioralStrengths: identifyStrengths(profile),
    improvementAreas: identifyImprovementAreas(profile)
  };
}
```

This behavioral signal extraction system demonstrates how gamified financial education can generate sophisticated behavioral intelligence while maintaining entertainment value and learning effectiveness.