'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface MemberCoreData {
  id: string;
  displayName: string;
  ubuntuScore: number;
  trustCircleSize: number;
  contributionTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  lastPaymentDate?: string;
  paymentStatus: 'current' | 'late' | 'pending';
  incomeVerifications: number;
}

export interface VillagePulseData {
  sentimentScore: number;
  trendingInterests: string[];
  activeDiscussions: number;
  trustFatigueLevel: number;
  socialEngagementRate: number;
}

export interface PoolHealthData {
  id: string;
  name: string;
  safetyBuffer: number;
  targetBuffer: number;
  liquidityRatio: number;
  memberCount: number;
  status: 'thriving' | 'stable' | 'stressed' | 'critical';
  recentActivity: { type: string; amount: number; timestamp: string }[];
}

export interface LindiweAnalysis {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  strategy: 'STABLE_GROWTH' | 'SOFT_NUDGE' | 'URGENT_SOCIAL_RECAPITALIZATION' | 'DEFENSIVE_HOLD';
  reasoning: string;
  recommendedActions: { type: string; description: string; urgency: 'low' | 'medium' | 'high' }[];
  learningToken: string;
  adminAlert?: { title: string; description: string; actionRequired: boolean };
}

export interface LindiweWeights {
  socialPressureWeight: number;
  financialStabilityWeight: number;
  poolUrgencyWeight: number;
  nudgeFrequency: number;
  trustFatigueThreshold: number;
  socialProofBonus: number;
}

interface LindiweConfig {
  memberCore: MemberCoreData;
  villagePulse: VillagePulseData;
  poolHealth: PoolHealthData;
  historicalData?: {
    avgPoolHealth: number;
    avgVillagePulse: number;
    previousStrategies: string[];
  };
}

const DEFAULT_WEIGHTS: LindiweWeights = {
  socialPressureWeight: 0.4,
  financialStabilityWeight: 0.3,
  poolUrgencyWeight: 0.3,
  nudgeFrequency: 0.5,
  trustFatigueThreshold: 0.7,
  socialProofBonus: 0.12,
};

export class LindiweInferenceEngine {
  private weights: LindiweWeights;
  private memoryStore: Map<string, { success: boolean; timestamp: number; outcome: string }>;
  private config: LindiweConfig;

  constructor(config: LindiweConfig) {
    this.config = config;
    this.weights = { ...DEFAULT_WEIGHTS };
    this.memoryStore = new Map();
    this.loadWeights();
  }

  private loadWeights(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lindiwe_weights');
      if (saved) {
        try {
          this.weights = { ...DEFAULT_WEIGHTS, ...JSON.parse(saved) };
        } catch {}
      }
    }
  }

  private saveWeights(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lindiwe_weights', JSON.stringify(this.weights));
    }
  }

  analyze(): LindiweAnalysis {
    const { memberCore, villagePulse, poolHealth, historicalData } = this.config;

    const healthGap = historicalData 
      ? poolHealth.liquidityRatio - historicalData.avgPoolHealth 
      : 0;
    
    const trustMomentum = villagePulse.sentimentScore > 0.6 ? 'positive' : 'negative';
    const socialPressure = villagePulse.sentimentScore;
    const financialStability = memberCore.ubuntuScore / 1000;
    const poolUrgency = poolHealth.safetyBuffer < poolHealth.targetBuffer * 0.3;

    const combinedScore = 
      (socialPressure * this.weights.socialPressureWeight) +
      (financialStability * this.weights.financialStabilityWeight) +
      (poolUrgency ? this.weights.poolUrgencyWeight : 0);

    let riskLevel: LindiweAnalysis['riskLevel'] = 'low';
    let strategy: LindiweAnalysis['strategy'] = 'STABLE_GROWTH';
    let reasoning = '';
    const recommendedActions: LindiweAnalysis['recommendedActions'] = [];

    if (poolUrgency && socialPressure > 0.8) {
      riskLevel = 'critical';
      strategy = 'URGENT_SOCIAL_RECAPITALIZATION';
      reasoning = `Our collective shade is thinning. The safety buffer has dipped to R${poolHealth.safetyBuffer.toLocaleString()}, but I see ${memberCore.trustCircleSize} members ready to help. A "Contribution Quest" aligned with trending #${villagePulse.trendingInterests[0]} could recapitalize us.`;
      
      recommendedActions.push({
        type: 'CONTRIBUTION_QUEST',
        description: `Launch a ${villagePulse.trendingInterests[0]} themed contribution drive`,
        urgency: 'high',
      });
      recommendedActions.push({
        type: 'BUFFER_REWARD',
        description: 'Activate 0.1% buffer-reward incentive for next 48 hours',
        urgency: 'medium',
      });

      if (historicalData) {
        const relevantMemory = this.findRelevantMemory('strategy_urgent_social_recapitalization');
        if (relevantMemory) {
          reasoning += ` My records show this approach worked before with ${relevantMemory.outcome}.`;
        }
      }
    } else if (healthGap < 0 && trustMomentum === 'positive') {
      riskLevel = 'medium';
      strategy = 'SOFT_NUDGE';
      reasoning = `Members are doing well but the pool is stressed. We should use social capital to stabilize the buffer without triggering trust fatigue.`;
      
      recommendedActions.push({
        type: 'SOCIAL_NUDGE',
        description: 'Send gentle reminder through Trust Circle network',
        urgency: 'low',
      });

      const relevantMemory = this.findRelevantMemory('strategy_soft_nudge_buffer_recovery');
      if (relevantMemory?.success) {
        this.weights.socialProofBonus = Math.min(this.weights.socialProofBonus * 1.05, 0.25);
      }
    } else if (villagePulse.trustFatigueLevel > this.weights.trustFatigueThreshold) {
      riskLevel = 'high';
      strategy = 'DEFENSIVE_HOLD';
      reasoning = `I've detected "Trust Fatigue" in your circle. Direct financial alerts are being ignored. I'll shift to social-interest updates to maintain engagement.`;
      
      recommendedActions.push({
        type: 'CONTENT_SHIFT',
        description: 'Replace financial notifications with project updates',
        urgency: 'high',
      });

      this.weights.nudgeFrequency *= 0.8;
    } else {
      reasoning = `Our Ubuntu Accord is stable. ${memberCore.displayName}'s score of ${memberCore.ubuntuScore} shows strong member core reliability. The Village Pulse is healthy with ${villagePulse.trendingInterests[0]} trending.`;
    }

    const adminAlert = riskLevel === 'critical' || riskLevel === 'high' 
      ? {
          title: riskLevel === 'critical' ? 'Liquidity Alert' : 'Trust Fatigue Detected',
          description: riskLevel === 'critical' 
            ? `Pool ${poolHealth.name} requires immediate attention. Recommending pool consolidation or buffer rebalancing.`
            : `Members in ${villagePulse.trendingInterests[0]} group showing disengagement. Consider Village Event to re-engage.`,
          actionRequired: riskLevel === 'critical',
        }
      : undefined;

    this.saveWeights();

    return {
      riskLevel,
      strategy,
      reasoning,
      recommendedActions,
      learningToken: `strategy_${strategy.toLowerCase()}_${Date.now()}`,
      adminAlert,
    };
  }

  private findRelevantMemory(tokenPrefix: string): { success: boolean; timestamp: number; outcome: string } | null {
    const entries = Array.from(this.memoryStore.entries());
    const relevant = entries.find(([key]) => key.startsWith(tokenPrefix));
    return relevant ? relevant[1] : null;
  }

  evolve(learningToken: string, success: boolean, outcome: string): void {
    this.memoryStore.set(learningToken, {
      success,
      outcome,
      timestamp: Date.now(),
    });

    if (success) {
      this.weights.socialPressureWeight = Math.min(this.weights.socialPressureWeight + 0.02, 0.6);
    } else {
      this.weights.socialPressureWeight = Math.max(this.weights.socialPressureWeight - 0.02, 0.2);
    }

    this.saveWeights();
  }

  getWeights(): LindiweWeights {
    return { ...this.weights };
  }

  getGreeting(): string {
    const greetings = [
      "Molo! Our collective shade is thinning.",
      "Sawubona! I'm watching over our Ubuntu Accord.",
      "Dumela! Your Village is thriving because of you.",
      "Avuxeni! The pulse of our community beats strong.",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  generateNudge(poolHealth: PoolHealthData, villagePulse: VillagePulseData): string {
    const urgency = poolHealth.safetyBuffer < poolHealth.targetBuffer * 0.5;
    const trending = villagePulse.trendingInterests[0] || 'collective growth';
    
    if (urgency) {
      return `If we stabilize the buffer today, I can unlock the #${trending} opportunity we've all been eyeing.`;
    }
    
    return `Our ${villagePulse.socialEngagementRate * 100}% engagement shows the Village is ready for #${trending}.`;
  }
}

export function useLindiwe(config: LindiweConfig) {
  const [engine] = useState(() => new LindiweInferenceEngine(config));
  const [analysis, setAnalysis] = useState<LindiweAnalysis | null>(null);
  const [weights, setWeights] = useState<LindiweWeights>(DEFAULT_WEIGHTS);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setAnalysis(engine.analyze());
    setWeights(engine.getWeights());
    setGreeting(engine.getGreeting());
  }, [engine]);

  const evolve = useCallback((token: string, success: boolean, outcome: string) => {
    engine.evolve(token, success, outcome);
    setWeights(engine.getWeights());
  }, [engine]);

  const generateNudge = useCallback(() => {
    return engine.generateNudge(config.poolHealth, config.villagePulse);
  }, [engine, config]);

  return {
    analysis,
    weights,
    greeting,
    evolve,
    generateNudge,
  };
}
