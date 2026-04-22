import { evaluate } from 'mathjs';
import { ValidationError } from '@vv/shared-kernel';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  timestamp: Date;
  type: 'deposit' | 'withdrawal';
  status: 'pending' | 'completed' | 'failed';
}

export interface VelocityMetrics {
  transactionCount: number;
  totalAmount: number;
  averageAmount: number;
  timeWindowHours: number;
  velocityScore: number;
}

export interface RiskAssessment {
  userId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  factors: RiskFactor[];
  recommendations: string[];
}

export interface RiskFactor {
  name: string;
  weight: number;
  value: number;
  threshold: number;
  breached: boolean;
}

export class LossVelocityEngine {
  private readonly DEFAULT_TIME_WINDOW_HOURS = 24;
  private readonly VELOCITY_THRESHOLDS = {
    low: 100,
    medium: 500,
    high: 1000,
    critical: 5000,
  };

  /**
   * Calculate velocity metrics for a user within a time window
   */
  calculateVelocity(
    transactions: Transaction[],
    timeWindowHours: number = this.DEFAULT_TIME_WINDOW_HOURS
  ): VelocityMetrics {
    const now = new Date();
    const windowStart = new Date(now.getTime() - timeWindowHours * 60 * 60 * 1000);

    const windowTransactions = transactions.filter(
      (tx) => tx.timestamp >= windowStart && tx.status === 'completed'
    );

    const transactionCount = windowTransactions.length;
    const totalAmount = windowTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const averageAmount = transactionCount > 0 ? totalAmount / transactionCount : 0;

    // Calculate velocity score based on transaction frequency and amount
    const velocityScore = this.calculateVelocityScore(
      transactionCount,
      totalAmount,
      timeWindowHours
    );

    return {
      transactionCount,
      totalAmount,
      averageAmount,
      timeWindowHours,
      velocityScore,
    };
  }

  /**
   * Calculate velocity score using a weighted algorithm
   */
  private calculateVelocityScore(count: number, amount: number, hours: number): number {
    // Normalize by time window
    const hourlyRate = count / hours;
    const hourlyAmount = amount / hours;

    // Weighted score: 40% transaction frequency, 60% amount velocity
    const frequencyScore = Math.min(hourlyRate * 10, 100); // Max 100 for 10+ tx/hour
    const amountScore = Math.min(hourlyAmount / 100, 100); // Max 100 for $10k+/hour

    return frequencyScore * 0.4 + amountScore * 0.6;
  }

  /**
   * Assess risk for a user based on transaction patterns
   */
  assessRisk(
    userId: string,
    transactions: Transaction[],
    additionalFactors: Record<string, number> = {}
  ): RiskAssessment {
    const velocity24h = this.calculateVelocity(transactions, 24);
    const velocity7d = this.calculateVelocity(transactions, 24 * 7);

    const factors: RiskFactor[] = [
      {
        name: 'daily_transaction_velocity',
        weight: 0.3,
        value: velocity24h.velocityScore,
        threshold: this.VELOCITY_THRESHOLDS.medium,
        breached: velocity24h.velocityScore > this.VELOCITY_THRESHOLDS.medium,
      },
      {
        name: 'weekly_transaction_velocity',
        weight: 0.2,
        value: velocity7d.velocityScore,
        threshold: this.VELOCITY_THRESHOLDS.high,
        breached: velocity7d.velocityScore > this.VELOCITY_THRESHOLDS.high,
      },
      {
        name: 'large_transaction_frequency',
        weight: 0.25,
        value: this.calculateLargeTransactionRatio(transactions),
        threshold: 0.3, // 30% of transactions are large
        breached: this.calculateLargeTransactionRatio(transactions) > 0.3,
      },
      {
        name: 'geographic_anomaly',
        weight: 0.15,
        value: additionalFactors.geographicAnomaly || 0,
        threshold: 0.5,
        breached: (additionalFactors.geographicAnomaly || 0) > 0.5,
      },
      {
        name: 'device_anomaly',
        weight: 0.1,
        value: additionalFactors.deviceAnomaly || 0,
        threshold: 0.3,
        breached: (additionalFactors.deviceAnomaly || 0) > 0.3,
      },
    ];

    const riskScore = factors.reduce((score, factor) => score + factor.value * factor.weight, 0);

    const riskLevel = this.determineRiskLevel(riskScore);
    const recommendations = this.generateRecommendations(factors, riskLevel);

    return {
      userId,
      riskLevel,
      riskScore,
      factors,
      recommendations,
    };
  }

  /**
   * Calculate ratio of large transactions (> $10k)
   */
  private calculateLargeTransactionRatio(transactions: Transaction[]): number {
    const completedTx = transactions.filter((tx) => tx.status === 'completed');
    if (completedTx.length === 0) return 0;

    const largeTxCount = completedTx.filter((tx) => tx.amount > 10000).length;
    return largeTxCount / completedTx.length;
  }

  /**
   * Determine risk level based on score
   */
  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * Generate risk mitigation recommendations
   */
  private generateRecommendations(factors: RiskFactor[], riskLevel: string): string[] {
    const recommendations: string[] = [];

    const breachedFactors = factors.filter((f) => f.breached);

    if (breachedFactors.some((f) => f.name.includes('velocity'))) {
      recommendations.push('Implement transaction velocity limits');
      recommendations.push('Require additional authentication for high-frequency transactions');
    }

    if (breachedFactors.some((f) => f.name.includes('large_transaction'))) {
      recommendations.push('Enhanced due diligence for large transactions');
      recommendations.push('Manual review required for transactions over $10,000');
    }

    if (breachedFactors.some((f) => f.name.includes('geographic'))) {
      recommendations.push('Verify user location and IP address');
      recommendations.push('Consider requiring additional identity verification');
    }

    if (breachedFactors.some((f) => f.name.includes('device'))) {
      recommendations.push('Check for device fingerprint anomalies');
      recommendations.push('Recommend password reset and 2FA setup');
    }

    if (riskLevel === 'critical') {
      recommendations.push('URGENT: Suspend account pending manual review');
      recommendations.push('Notify compliance team immediately');
    } else if (riskLevel === 'high') {
      recommendations.push('Require enhanced authentication');
      recommendations.push('Limit transaction amounts temporarily');
    }

    return recommendations;
  }

  /**
   * Evaluate custom risk rules using mathematical expressions
   */
  evaluateRiskRule(rule: string, context: Record<string, number>): boolean {
    try {
      // Replace variables in the rule with actual values
      let processedRule = rule;
      for (const [key, value] of Object.entries(context)) {
        processedRule = processedRule.replace(new RegExp(`\\b${key}\\b`, 'g'), value.toString());
      }

      // Evaluate the mathematical expression
      const result = evaluate(processedRule);
      return Boolean(result);
    } catch (error) {
      throw new ValidationError(`Invalid risk rule: ${rule}`);
    }
  }

  /**
   * Batch process risk assessments for multiple users
   */
  batchAssessRisk(
    userTransactions: Record<string, Transaction[]>,
    additionalFactors: Record<string, Record<string, number>> = {}
  ): Record<string, RiskAssessment> {
    const results: Record<string, RiskAssessment> = {};

    for (const [userId, transactions] of Object.entries(userTransactions)) {
      const factors = additionalFactors[userId] || {};
      results[userId] = this.assessRisk(userId, transactions, factors);
    }

    return results;
  }

  /**
   * Get risk threshold configuration
   */
  getRiskThresholds(): typeof this.VELOCITY_THRESHOLDS {
    return { ...this.VELOCITY_THRESHOLDS };
  }

  /**
   * Update risk thresholds (admin function)
   */
  updateRiskThresholds(thresholds: Partial<typeof this.VELOCITY_THRESHOLDS>): void {
    Object.assign(this.VELOCITY_THRESHOLDS, thresholds);
  }
}

// Factory function
export function createLossVelocityEngine(): LossVelocityEngine {
  return new LossVelocityEngine();
}
