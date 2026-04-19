import { z } from 'zod';
import { randomUUID } from 'crypto';
import { BankTransaction } from '@ubuntu/lindiwe/bank-provider/types';
import type { GameTelemetryPayload, LindiweSignal, CreditSignal } from '@ubuntu/games/types';

export interface VillagePulse {
  overall: number;
  anxiety: number;
  excitement: number;
  stability: number;
  timestamp: Date;
}

export interface SafetyBufferState {
  currentBalance: number;
  targetBalance: number;
  healthRatio: number;
  lastUpdated: Date;
}

export interface LindiweReasoningResult {
  reasoning: string;
  confidence: number;
  recommendedAction: 'tighten' | 'expand' | 'maintain' | 'emergency';
  thresholdAdjustment?: number;
  riskFlags: string[];
  insight: string;
}

export interface PoolHealthContext {
  bufferBalance: number;
  bufferTarget: number;
  poolHealthScore: number;
  activeMembers: number;
  defaultRate: number;
  contributionRate: number;
}

const REASONING_SCHEMA = z.object({
  currentBuffer: z.number(),
  targetBalance: z.number(),
  poolHealth: z.number(),
  villagePulse: z.object({
    anxiety: z.number(),
    excitement: z.number(),
    stability: z.number(),
  }),
  memberScores: z.array(z.object({
    memberId: z.string(),
    score: z.number(),
    recentActivity: z.number(),
  })),
  recentOutcomes: z.enum(['success', 'failure', 'mixed']).default('mixed'),
});

export interface ShieldConfirmation {
  /** The initial analysis that triggered shield consideration */
  pendingResult: LindiweReasoningResult;
  /** Timestamp when the confirmation window opened */
  requestedAt: Date;
  /** Confirmation window duration in milliseconds (default: 30s) */
  windowMs: number;
}

export interface LindiweExplanation {
  id: string;
  ts: number;
  inputs: {
    bufferRatio: number;
    anxiety: number;
    stability: number;
    excitement: number;
    poolHealthScore: number;
    recentOutcomes: 'success' | 'failure' | 'mixed';
  };
  decisions: Array<{
    mode: 'emergency' | 'tighten' | 'expand' | 'maintain';
    activated: boolean;
    requiresApproval: boolean;
    reason: string;
    thresholds: Record<string, number>;
  }>;
  humanApproval?: { approved: boolean; approverId: string; ts: number };
}

export class LindiweAI {
  private reasoningHistory: LindiweReasoningResult[] = [];
  private explanationLog: LindiweExplanation[] = [];
  private learningWeights: Map<string, number> = new Map();
  /** Pending shield/emergency escalation awaiting confirmation */
  private pendingShieldConfirmation: ShieldConfirmation | null = null;
  /** Confirmation window duration in ms — configurable for testing */
  private confirmationWindowMs: number;

  constructor(confirmationWindowMs: number = 30_000) {
    this.confirmationWindowMs = confirmationWindowMs;
    this.initializeLearningWeights();
  }

  private initializeLearningWeights() {
    this.learningWeights.set('buffer_weight', 0.35);
    this.learningWeights.set('pulse_weight', 0.25);
    this.learningWeights.set('member_weight', 0.25);
    this.learningWeights.set('outcome_weight', 0.15);
  }

  analyze(
    bufferState: SafetyBufferState,
    villagePulse: VillagePulse,
    poolHealthContext: PoolHealthContext,
    recentOutcomes: 'success' | 'failure' | 'mixed' = 'mixed'
  ): LindiweReasoningResult {
    const bufferRatio = bufferState.currentBalance / (bufferState.targetBalance || 1);
    const anxiety = villagePulse.anxiety;
    const stability = villagePulse.stability;
    
    let recommendedAction: LindiweReasoningResult['recommendedAction'] = 'maintain';
    let thresholdAdjustment = 0;
    const riskFlags: string[] = [];
    let reasoning = '';
    let insight = '';
    let confidence = 0.85;

    if (bufferRatio < 0.1 && anxiety > 0.7) {
      recommendedAction = 'emergency';
      thresholdAdjustment = 150;
      confidence = 0.95;
      reasoning = `CRITICAL: Buffer at ${(bufferRatio * 100).toFixed(1)}% with high community anxiety (${(anxiety * 100).toFixed(0)}%). Immediate intervention required.`;
      insight = 'Lindiwe has activated EMERGENCY SHIELD. Only Village Elders (Score > 850) may form or join pools until stability returns.';
      riskFlags.push('CRITICAL_BUFFER', 'HIGH_ANXIETY', 'SYSTEM_AT_RISK');
    }
    else if (bufferRatio < 0.25 && anxiety > 0.5) {
      recommendedAction = 'tighten';
      thresholdAdjustment = 75;
      confidence = 0.9;
      reasoning = `Buffer depleted (${(bufferRatio * 100).toFixed(1)}%) with elevated anxiety (${(anxiety * 100).toFixed(0)}%). Tightening entry requirements to protect community.`;
      insight = 'Lindiwe has activated SHIELD MODE. Entry thresholds increased to filter high-risk members. This helps rebuild the Safety Buffer.';
      riskFlags.push('LOW_BUFFER', 'ELEVATED_ANXIETY');
    }
    else if (bufferRatio < 0.5 && stability > 0.6) {
      recommendedAction = 'tighten';
      thresholdAdjustment = 35;
      confidence = 0.8;
      reasoning = `Buffer needs attention (${(bufferRatio * 100).toFixed(1)}%). Maintaining stability but proactive tightening warranted.`;
      insight = 'Lindiwe has slightly tightened entry requirements to gradually rebuild the Safety Buffer while maintaining community growth.';
      riskFlags.push('BUFFER_DEPLETED');
    }
    else if (bufferRatio >= 1.0 && stability > 0.7 && anxiety < 0.3) {
      recommendedAction = 'expand';
      thresholdAdjustment = -50;
      confidence = 0.85;
      reasoning = `Buffer THRIVING at ${(bufferRatio * 100).toFixed(1)}% with strong stability. Community ready for expansion.`;
      insight = 'The Village is PROSPERING. Lindiwe has lowered entry barriers to welcome new seekers. Growth mode activated!';
      riskFlags.push('BUFFERS_STRONG');
    }
    else if (bufferRatio >= 0.75 && villagePulse.excitement > 0.5) {
      recommendedAction = 'expand';
      thresholdAdjustment = -25;
      confidence = 0.75;
      reasoning = `Buffer healthy (${(bufferRatio * 100).toFixed(1)}%) with high community excitement. Opportunity for measured expansion.`;
      insight = 'Lindiwe sees opportunity for measured growth. Entry requirements eased for trusted community members.';
      riskFlags.push('GROWTH_OPPORTUNITY');
    }
    else {
      recommendedAction = 'maintain';
      thresholdAdjustment = 0;
      confidence = 0.8;
      reasoning = `Buffer at ${(bufferRatio * 100).toFixed(1)}% with balanced sentiment. Current thresholds appropriate.`;
      insight = 'Lindiwe sees balanced conditions. The Village maintains its current course.';
      riskFlags.push('STEADY_STATE');
    }

    if (recentOutcomes === 'failure') {
      riskFlags.push('RECENT_FAILURES');
      if (recommendedAction !== 'emergency') {
        thresholdAdjustment += Math.max(thresholdAdjustment * 0.25, 20);
      }
    } else if (recentOutcomes === 'success') {
      riskFlags.push('RECENT_SUCCESSES');
      if (recommendedAction === 'expand') {
        thresholdAdjustment -= 15;
      }
    }

    const result: LindiweReasoningResult = {
      reasoning,
      confidence,
      recommendedAction,
      thresholdAdjustment,
      riskFlags,
      insight,
    };

    // Dual-validation: escalation to tighten/emergency requires confirmation
    const isEscalation = recommendedAction === 'tighten' || recommendedAction === 'emergency';

    if (isEscalation && this.pendingShieldConfirmation === null) {
      // First signal — open confirmation window, return maintain instead
      this.pendingShieldConfirmation = {
        pendingResult: result,
        requestedAt: new Date(),
        windowMs: this.confirmationWindowMs,
      };

      const holdResult: LindiweReasoningResult = {
        reasoning: `[CONFIRMATION PENDING] ${reasoning}`,
        confidence: confidence * 0.5,
        recommendedAction: 'maintain',
        thresholdAdjustment: 0,
        riskFlags: [...riskFlags, 'AWAITING_CONFIRMATION'],
        insight: 'Lindiwe detected stress signals but is waiting for confirmation before escalating. This prevents false shield triggers.',
      };

      this.recordExplanation(bufferRatio, villagePulse, poolHealthContext, recentOutcomes, holdResult);

      this.reasoningHistory.push(holdResult);
      if (this.reasoningHistory.length > 100) {
        this.reasoningHistory.shift();
      }

      return holdResult;
    }

    if (isEscalation && this.pendingShieldConfirmation !== null) {
      // Second signal confirms — clear pending and allow escalation
      this.pendingShieldConfirmation = null;
      result.riskFlags.push('DUAL_VALIDATED');
    }

    if (!isEscalation) {
      // Conditions improved — cancel any pending escalation
      this.pendingShieldConfirmation = null;
    }

    this.recordExplanation(bufferRatio, villagePulse, poolHealthContext, recentOutcomes, result);

    this.reasoningHistory.push(result);
    if (this.reasoningHistory.length > 100) {
      this.reasoningHistory.shift();
    }

    return result;
  }

  analyzeTransactionPatterns(transactions: BankTransaction[]): {
    behavioralScore: number;
    riskAssessment: 'low' | 'medium' | 'high' | 'critical';
    indicators: string[];
    recommendations: string[];
  } {
    const categoryScores: Record<string, { points: number; count: number }> = {};
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentTransactions = transactions.filter(t => 
      new Date(t.date) >= thirtyDaysAgo
    );

    for (const tx of recentTransactions) {
      const category = this.categorizeTransaction(tx);
      if (!categoryScores[category]) {
        categoryScores[category] = { points: 0, count: 0 };
      }
      categoryScores[category].count++;
    }

    let behavioralScore = 50;
    const indicators: string[] = [];
    const recommendations: string[] = [];

    const communityScore = (categoryScores['community']?.count || 0);
    const savingsScore = (categoryScores['savings']?.count || 0);
    const utilitiesScore = (categoryScores['utilities']?.count || 0);
    const essentialScore = (categoryScores['essential']?.count || 0);
    const discretionaryScore = (categoryScores['discretionary']?.count || 0);
    const highRiskScore = (categoryScores['high_risk']?.count || 0);

    if (communityScore > 0) {
      behavioralScore += Math.min(communityScore * 3, 15);
      indicators.push(`Community contributions: ${communityScore} transactions`);
    }

    if (savingsScore > 0) {
      behavioralScore += Math.min(savingsScore * 2, 10);
      indicators.push(`Savings activity: ${savingsScore} transactions`);
    }

    if (utilitiesScore > 2) {
      behavioralScore += 5;
      indicators.push('Stable utility payments');
    }

    if (essentialScore > discretionaryScore) {
      behavioralScore += 5;
      indicators.push('Healthy essential-to-discretionary ratio');
    }

    behavioralScore -= Math.min(highRiskScore * 8, 25);
    if (highRiskScore > 0) {
      indicators.push(`HIGH RISK: ${highRiskScore} high-risk transactions detected`);
      recommendations.push('Monitor closely for liquidity concerns');
    }

    const balanceVolatility = this.calculateBalanceVolatility(transactions);
    if (balanceVolatility > 0.5) {
      behavioralScore -= 10;
      indicators.push('High balance volatility detected');
      recommendations.push('Request additional contribution history');
    }

    behavioralScore = Math.max(0, Math.min(100, behavioralScore));

    let riskAssessment: 'low' | 'medium' | 'high' | 'critical';
    if (behavioralScore >= 70) riskAssessment = 'low';
    else if (behavioralScore >= 50) riskAssessment = 'medium';
    else if (behavioralScore >= 30) riskAssessment = 'high';
    else riskAssessment = 'critical';

    if (recommendations.length === 0 && riskAssessment !== 'low') {
      recommendations.push('Continue monitoring transaction patterns');
    }

    return {
      behavioralScore,
      riskAssessment,
      indicators,
      recommendations,
    };
  }

  private categorizeTransaction(tx: BankTransaction): string {
    const name = (tx.name + ' ' + (tx.merchantName || '')).toLowerCase();
    const category = tx.category?.[0]?.toLowerCase() || '';

    if (name.includes('stokvel') || name.includes('savings') || name.includes('investment') || name.includes('unit trust')) {
      return 'community';
    }
    if (name.includes('savings') || name.includes('deposit') || name.includes('fnb savings') || name.includes('capitec savings')) {
      return 'savings';
    }
    if (category.includes('utilities') || name.includes('eskom') || name.includes('municipality') || name.includes('water') || name.includes('telkom') || name.includes('vodacom') || name.includes('mtn')) {
      return 'utilities';
    }
    if (category.includes('food') || category.includes('groceries') || name.includes('shoprite') || name.includes('pick n pay') || name.includes('spar') || name.includes('woolworths')) {
      return 'essential';
    }
    if (category.includes('entertainment') || category.includes('shopping') || category.includes('travel') || name.includes('takealot') || name.includes('superbalist')) {
      return 'discretionary';
    }
    if (name.includes('bet') || name.includes('casino') || name.includes('lotto') || name.includes('gambling') || name.includes('tsogo')) {
      return 'high_risk';
    }
    if (category.includes('transfer') || name.includes('eft') || name.includes('payment')) {
      return 'transfer';
    }

    return 'other';
  }

  private calculateBalanceVolatility(transactions: BankTransaction[]): number {
    if (transactions.length < 2) return 0;

    const balances: number[] = [];
    let runningBalance = 0;

    for (const tx of transactions.sort((a, b) => a.date.localeCompare(b.date))) {
      runningBalance += tx.amount;
      balances.push(runningBalance);
    }

    const mean = balances.reduce((a, b) => a + b, 0) / balances.length;
    const variance = balances.reduce((sum, b) => sum + Math.pow(b - mean, 2), 0) / balances.length;
    const stdDev = Math.sqrt(variance);

    return mean !== 0 ? Math.abs(stdDev / mean) : 0;
  }

  private recordExplanation(
    bufferRatio: number,
    pulse: VillagePulse,
    poolHealth: PoolHealthContext,
    recentOutcomes: 'success' | 'failure' | 'mixed',
    result: LindiweReasoningResult
  ): void {
    const explanation: LindiweExplanation = {
      id: randomUUID(),
      ts: Date.now(),
      inputs: {
        bufferRatio,
        anxiety: pulse.anxiety,
        stability: pulse.stability,
        excitement: pulse.excitement,
        poolHealthScore: poolHealth.poolHealthScore,
        recentOutcomes,
      },
      decisions: [
        {
          mode: result.recommendedAction,
          activated: result.recommendedAction !== 'maintain',
          requiresApproval: result.recommendedAction === 'emergency',
          reason: result.reasoning,
          thresholds: {
            emergencyBuffer: 0.1,
            emergencyAnxiety: 0.7,
            shieldBuffer: 0.25,
            shieldAnxiety: 0.5,
            prosperityBuffer: 1.0,
            prosperityStability: 0.7,
            prosperityMaxAnxiety: 0.3,
          },
        },
      ],
    };

    this.explanationLog.push(explanation);
    if (this.explanationLog.length > 200) {
      this.explanationLog.shift();
    }
  }

  getExplanationLog(): LindiweExplanation[] {
    return [...this.explanationLog];
  }

  getLatestExplanation(): LindiweExplanation | null {
    return this.explanationLog[this.explanationLog.length - 1] || null;
  }

  getPendingShieldConfirmation(): ShieldConfirmation | null {
    return this.pendingShieldConfirmation;
  }

  clearPendingConfirmation(): void {
    this.pendingShieldConfirmation = null;
  }

  getReasoningHistory(): LindiweReasoningResult[] {
    return [...this.reasoningHistory];
  }

  getLatestReasoning(): LindiweReasoningResult | null {
    return this.reasoningHistory[this.reasoningHistory.length - 1] || null;
  }

  applyLearning(outcome: 'success' | 'failure', context: string): void {
    const currentWeight = this.learningWeights.get(context) || 0.25;
    const adjustment = outcome === 'success' ? 0.02 : -0.02;
    const newWeight = Math.max(0.1, Math.min(0.5, currentWeight + adjustment));
    this.learningWeights.set(context, newWeight);
  }

  getLearningWeights(): Record<string, number> {
    return Object.fromEntries(this.learningWeights);
  }
}

export const lindiweAI = new LindiweAI();

export function getVillagePulse(
  socialActivity: number,
  contributionRate: number,
  poolHealth: number
): VillagePulse {
  const now = new Date();
  
  const stability = Math.min(1, (contributionRate * 0.4 + poolHealth * 0.6));
  const excitement = Math.min(1, (socialActivity * 0.6 + poolHealth * 0.4));
  const anxiety = Math.max(0, 1 - stability - excitement * 0.3);
  
  return {
    overall: (stability + excitement + (1 - anxiety)) / 3,
    anxiety: Math.round(anxiety * 100) / 100,
    excitement: Math.round(excitement * 100) / 100,
    stability: Math.round(stability * 100) / 100,
    timestamp: now,
  };
}

export function createDefaultSafetyBuffer(): SafetyBufferState {
  return {
    currentBalance: 0,
    targetBalance: 2300,
    healthRatio: 0,
    lastUpdated: new Date(),
  };
}

// ── Phase 15: Credit Intelligence from Game Telemetry ──────────────────────

/**
 * Process game telemetry into Lindiwe credit signals
 * POPIA compliant: only derived signals, no raw event storage
 */
export function processGameTelemetry(telemetry: GameTelemetryPayload): LindiweSignal {
  const { memberId, signals, consentGiven } = telemetry;

  if (!consentGiven) {
    throw new Error('Member has not consented to telemetry sharing');
  }

  // Extract key risk components from signals
  const riskAppetite = signals.find(s => s.type === 'risk_appetite')?.value || 50;
  const overextension = signals.find(s => s.type === 'overextension')?.value || 0;
  const stressResponse = signals.find(s => s.type === 'stress_response')?.value || 50;
  const leadershipIndex = signals.find(s => s.type === 'leadership_index')?.value || 50;

  // Calculate risk tier
  const riskTier = calculateRiskTier(riskAppetite, overextension, stressResponse);

  // Calculate credit recommendation
  const creditRecommendation = calculateCreditRecommendation(riskTier, leadershipIndex, stressResponse);

  // Check for early warning flag
  const earlyWarningFlag = detectEarlyWarning(signals);

  // Generate explainability string
  const explainability = generateExplainability(signals, riskTier, creditRecommendation, earlyWarningFlag);

  const signal: LindiweSignal = {
    memberId,
    source: 'game_telemetry',
    riskTier,
    riskComponents: {
      riskAppetiteIndex: riskAppetite,
      overextensionScore: overextension,
      stressResponsePattern: stressResponse,
      contributionConsistency: leadershipIndex, // Using leadership as proxy for consistency
    },
    creditRecommendation,
    sovereigntyMetadata: {
      consentVersion: '1.0',
      derivedFrom: 'game_signals',
      erasable: true,
    },
    explainability,
    generatedAt: new Date(),
  };

  return signal;
}

/**
 * Calculate risk tier from game signals
 */
function calculateRiskTier(riskAppetite: number, overextension: number, stressResponse: number): 'conservative' | 'moderate' | 'growth' {
  const totalRisk = (riskAppetite + overextension + (100 - stressResponse)) / 3;

  if (totalRisk < 40) return 'conservative';
  if (totalRisk < 70) return 'moderate';
  return 'growth';
}

/**
 * Calculate credit recommendation based on risk assessment
 */
function calculateCreditRecommendation(
  riskTier: string,
  leadershipIndex: number,
  stressResponse: number
): {
  maxCreditLimit: number;
  recommendedProduct: 'buffer_loan' | 'microcredit' | 'growth_credit';
  confidence: number;
  earlyWarningFlag: boolean;
} {
  let maxCreditLimit = 0;
  let recommendedProduct: 'buffer_loan' | 'microcredit' | 'growth_credit' = 'buffer_loan';
  let confidence = 0.8;

  switch (riskTier) {
    case 'conservative':
      maxCreditLimit = Math.min(5000, 1000 + leadershipIndex * 40);
      recommendedProduct = 'buffer_loan';
      confidence = 0.9;
      break;
    case 'moderate':
      maxCreditLimit = Math.min(15000, 2000 + leadershipIndex * 80);
      recommendedProduct = 'microcredit';
      confidence = 0.8;
      break;
    case 'growth':
      maxCreditLimit = Math.min(50000, 5000 + leadershipIndex * 200);
      recommendedProduct = 'growth_credit';
      confidence = 0.7;
      break;
  }

  // Adjust for stress response
  if (stressResponse < 30) {
    maxCreditLimit *= 0.7;
    confidence -= 0.1;
  } else if (stressResponse > 80) {
    maxCreditLimit *= 1.2;
    confidence += 0.05;
  }

  return {
    maxCreditLimit: Math.round(maxCreditLimit),
    recommendedProduct,
    confidence: Math.max(0.1, Math.min(1.0, confidence)),
    earlyWarningFlag: false, // Set by detectEarlyWarning
  };
}

/**
 * Detect early warning signals for pre-default counselling
 */
function detectEarlyWarning(signals: Array<{ type: string; value: number }>): boolean {
  const overextension = signals.find(s => s.type === 'overextension')?.value || 0;
  const stressResponse = signals.find(s => s.type === 'stress_response')?.value || 50;
  const riskAppetite = signals.find(s => s.type === 'risk_appetite')?.value || 50;

  // Trigger counselling if overextension > 70 and stress response < 40
  return overextension > 70 && stressResponse < 40;
}

/**
 * Generate human-readable explanation for POPIA compliance
 */
function generateExplainability(
  signals: Array<{ type: string; value: number; rationale: string }>,
  riskTier: string,
  recommendation: any,
  earlyWarning: boolean
): string {
  const explanations: string[] = [];

  signals.forEach(signal => {
    explanations.push(`${signal.type.replace('_', ' ')}: ${signal.value}/100 - ${signal.rationale}`);
  });

  let summary = `Risk tier: ${riskTier}. Recommended: ${recommendation.recommendedProduct} up to R${recommendation.maxCreditLimit}.`;

  if (earlyWarning) {
    summary += ' EARLY WARNING: Pre-default signals detected. Counselling recommended.';
  }

  return [summary, ...explanations].join(' ');
}

/**
 * Convert LindiweSignal to CreditSignal (currently identical, but allows for future extensions)
 */
export function convertToCreditSignal(signal: LindiweSignal): CreditSignal {
  return { ...signal };
}
