import { lindiweAI, getVillagePulse, type LindiweReasoningResult, type SafetyBufferState, type VillagePulse } from './lindiwe';
import { calculateUbuntuScore, calculatePoolHealthFromInput, type MemberContributionHistory, type PoolHealthInput } from '../services/credit-service';
import { generateProsperityOpportunity, type MatchmakerInput } from '../services/matchmaker';
import { sovereigntyProxy, type SanitizedProfile } from '../services/sovereignty-proxy';
import { getDodoPaymentsProvider } from '../bank-provider/dodo-payments';
import type { BankTransaction } from '../bank-provider/types';
import { openClawGateway, type OpenClawNotification } from '../openclaw/gateway';
import { promotionLogs, villageMembers } from '@/db/schema-village';
import { db } from '@/db/client';
import { ubuntuScores } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface BackboneConfig {
  safetyBufferTarget: number;
  minSafetyBuffer: number;
  criticalSafetyBuffer: number;
  defaultEntryThreshold: number;
  elderThreshold: number;
}

export interface BackboneState {
  currentMode: 'prosperity' | 'expansion' | 'stability' | 'shield' | 'emergency';
  entryThreshold: number;
  safetyBuffer: SafetyBufferState;
  villagePulse: VillagePulse;
  lastRegulation: Date;
  regulationCount: number;
}

export interface BackboneAuditEntry {
  id: string;
  timestamp: Date;
  trigger: string;
  reasoning: string;
  action: string;
  thresholdBefore: number;
  thresholdAfter: number;
  bufferState: SafetyBufferState;
  mode: BackboneState['currentMode'];
}

export interface GameBehavioralSignals {
  risk_appetite: number;
  cooperative_quotient: number;
  stress_response: number;
  leadership_index: number;
  overextension: number;
  knowledge_score: number;
  stewardship_potential: number; // Derived from leadership_index + cooperative_quotient
}

export interface GameBehavioralSignals {
  risk_appetite: number;
  cooperative_quotient: number;
  stress_response: number;
  leadership_index: number;
  overextension: number;
  knowledge_score: number;
  stewardship_potential: number; // Derived from leadership_index + cooperative_quotient
}

export interface MemberBackboneProfile {
  memberId: string;
  ubuntuScore: number;
  behavioralScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastTransactionSync: Date | null;
  contributionHistory: MemberContributionHistory;
  sanitizedProfile: SanitizedProfile;
  gameSignals?: GameBehavioralSignals; // Game-derived behavioral signals
}

const DEFAULT_CONFIG: BackboneConfig = {
  safetyBufferTarget: 2300,
  minSafetyBuffer: 1500,
  criticalSafetyBuffer: 500,
  defaultEntryThreshold: 650,
  elderThreshold: 850,
};

const MODE_THRESHOLDS = {
  prosperity: { minBuffer: 1.0, maxAnxiety: 0.3, minStability: 0.7 },
  expansion: { minBuffer: 0.75, maxAnxiety: 0.4, minStability: 0.6 },
  stability: { minBuffer: 0.5, maxAnxiety: 0.5, minStability: 0.5 },
  shield: { minBuffer: 0.25, maxAnxiety: 0.7, minStability: 0.3 },
  emergency: { minBuffer: 0.1, maxAnxiety: 1.0, minStability: 0 },
};

export class UbuntuBackbone {
  private config: BackboneConfig;
  private state: BackboneState;
  private auditTrail: BackboneAuditEntry[];
  private memberProfiles: Map<string, MemberBackboneProfile>;

  constructor(config: Partial<BackboneConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      currentMode: 'expansion',
      entryThreshold: this.config.defaultEntryThreshold,
      safetyBuffer: {
        currentBalance: 0,
        targetBalance: this.config.safetyBufferTarget,
        healthRatio: 0,
        lastUpdated: new Date(),
      },
      villagePulse: {
        overall: 0.5,
        anxiety: 0.3,
        excitement: 0.3,
        stability: 0.5,
        timestamp: new Date(),
      },
      lastRegulation: new Date(),
      regulationCount: 0,
    };
    this.auditTrail = [];
    this.memberProfiles = new Map();
  }

  async syncMemberData(memberId: string, accessToken: string): Promise<MemberBackboneProfile> {
    const provider = getDodoPaymentsProvider();
    
    const transactions = await provider.getTransactions(
      accessToken,
      this.getDefaultStartDate(),
      new Date().toISOString().split('T')[0]
    );

    const behavioralAnalysis = lindiweAI.analyzeTransactionPatterns(transactions.transactions);

    const contributionHistory = this.deriveContributionHistory(transactions.transactions);
    const poolHealthInput: PoolHealthInput = {
      bufferBalance: this.state.safetyBuffer.currentBalance,
      totalExposure: this.calculateTotalWithdrawals(transactions.transactions),
      defaultCount: 0,
      activeLoanCount: 0,
    };

    const ubuntuScoreResult = calculateUbuntuScore(contributionHistory, poolHealthInput);

    const sanitizedProfile = sovereigntyProxy.getSanitizedProfile(memberId);

    const profile: MemberBackboneProfile = {
      memberId,
      ubuntuScore: ubuntuScoreResult.score,
      behavioralScore: behavioralAnalysis.behavioralScore,
      riskLevel: behavioralAnalysis.riskAssessment,
      lastTransactionSync: new Date(),
      contributionHistory,
      sanitizedProfile,
    };

    this.memberProfiles.set(memberId, profile);

    return profile;
  }

  regulate(): LindiweReasoningResult {
    const reasoning = lindiweAI.analyze(
      this.state.safetyBuffer,
      this.state.villagePulse,
      {
        bufferBalance: this.state.safetyBuffer.currentBalance,
        bufferTarget: this.state.safetyBuffer.targetBalance,
        poolHealthScore: this.calculatePoolHealth(),
        activeMembers: this.memberProfiles.size,
        defaultRate: this.calculateDefaultRate(),
        contributionRate: this.calculateContributionRate(),
      },
      this.determineRecentOutcomes()
    );

    const thresholdBefore = this.state.entryThreshold;
    let thresholdAfter = thresholdBefore;

    if (reasoning.recommendedAction === 'emergency') {
      thresholdAfter = this.config.elderThreshold;
      this.state.currentMode = 'emergency';
    } else if (reasoning.recommendedAction === 'tighten') {
      thresholdAfter = Math.min(thresholdBefore + reasoning.thresholdAdjustment!, this.config.elderThreshold);
      this.state.currentMode = this.state.entryThreshold >= 750 ? 'shield' : 'stability';
    } else if (reasoning.recommendedAction === 'expand') {
      thresholdAfter = Math.max(thresholdBefore + reasoning.thresholdAdjustment!, 500);
      this.state.currentMode = thresholdAfter <= 600 ? 'prosperity' : 'expansion';
    } else {
      this.state.currentMode = 'stability';
    }

    thresholdAfter = Math.max(500, Math.min(1000, thresholdAfter));
    this.state.entryThreshold = thresholdAfter;
    this.state.lastRegulation = new Date();
    this.state.regulationCount++;

    const previousMode = this.auditTrail.length > 0 ? this.auditTrail[this.auditTrail.length - 1].mode : null;
    const modeChanged = previousMode !== this.state.currentMode;

    this.recordAuditEntry({
      trigger: 'automatic_regulation',
      reasoning: reasoning.reasoning,
      action: reasoning.recommendedAction,
      thresholdBefore,
      thresholdAfter,
      mode: this.state.currentMode,
    });

    if (modeChanged) {
      const notification: OpenClawNotification = {
        type: this.state.currentMode === 'shield' ? 'SHIELD' : 
              this.state.currentMode === 'emergency' ? 'EMERGENCY' :
              this.state.currentMode === 'prosperity' ? 'PROSPERITY' : 'MODE_CHANGE',
        mode: this.state.currentMode,
        buffer: {
          current: this.state.safetyBuffer.currentBalance,
          target: this.state.safetyBuffer.targetBalance,
          healthRatio: this.state.safetyBuffer.healthRatio,
        },
        reasoning: reasoning.reasoning,
        riskFlags: reasoning.riskFlags,
        confidence: reasoning.confidence,
        timestamp: new Date().toISOString(),
      };
      this.notifyOpenClaw(notification);
    }

    return reasoning;
  }

  updateSafetyBuffer(amount: number): void {
    this.state.safetyBuffer.currentBalance += amount;
    this.state.safetyBuffer.healthRatio = 
      this.state.safetyBuffer.currentBalance / this.state.safetyBuffer.targetBalance;
    this.state.safetyBuffer.lastUpdated = new Date();

    if (this.state.safetyBuffer.currentBalance < this.config.criticalSafetyBuffer) {
      this.triggerEmergencyRegulation();
    }
  }

  updateVillagePulse(socialActivity: number, contributionRate: number): void {
    this.state.villagePulse = getVillagePulse(
      socialActivity,
      contributionRate,
      this.calculatePoolHealth()
    );
  }

  getState(): BackboneState {
    return { ...this.state };
  }

  getConfig(): BackboneConfig {
    return { ...this.config };
  }

  getMemberProfile(memberId: string): MemberBackboneProfile | undefined {
    return this.memberProfiles.get(memberId);
  }

  getAllMemberProfiles(): MemberBackboneProfile[] {
    return Array.from(this.memberProfiles.values());
  }

  updateMemberGameSignals(memberId: string, gameSignals: GameBehavioralSignals): void {
    const profile = this.memberProfiles.get(memberId);
    if (profile) {
      profile.gameSignals = gameSignals;
      // Update behavioralScore based on game signals
      profile.behavioralScore = Math.round(
        (gameSignals.stewardship_potential +
         gameSignals.cooperative_quotient +
         (100 - gameSignals.risk_appetite) +
         (100 - gameSignals.overextension)) / 4
      );
      // Update risk level based on signals
      if (profile.behavioralScore >= 80) {
        profile.riskLevel = 'low';
      } else if (profile.behavioralScore >= 60) {
        profile.riskLevel = 'medium';
      } else if (profile.behavioralScore >= 40) {
        profile.riskLevel = 'high';
      } else {
        profile.riskLevel = 'critical';
      }

      // Check for automatic Contributor promotion (Novice → Contributor)
      this.checkAutomaticContributorPromotion(memberId, profile);

      // Check for Guardian nomination (Steward → Guardian)
      this.checkGuardianNomination(memberId, profile);
    }
  }

  private async checkAutomaticContributorPromotion(memberId: string, profile: MemberBackboneProfile): Promise<void> {
    // Automatic promotion: Novice (0-19) → Contributor (20-39)
    // Requires: High behavioral score AND game signals indicating readiness AND 30+ days in village
    if (profile.ubuntuScore >= 0 && profile.ubuntuScore <= 19) {
      if (profile.behavioralScore && profile.behavioralScore >= 70) {
        // Check time-in-village requirement (30 days minimum)
        const timeInVillage = await this.getMemberTimeInVillage(memberId);
        const daysInVillage = timeInVillage / (1000 * 60 * 60 * 24); // Convert to days

        if (daysInVillage >= 30) {
          // Automatic promotion to Contributor level
          await this.executePromotion(memberId, 'novice', 'contributor', 'AUTOMATED', profile.gameSignals);
          console.log(`Member ${memberId} automatically promoted to Contributor level after ${daysInVillage.toFixed(1)} days`);
        } else {
          console.log(`Member ${memberId} eligible but needs ${(30 - daysInVillage).toFixed(1)} more days in village`);
        }
      }
    }
  }

  private async getMemberTimeInVillage(memberId: string): Promise<number> {
    // Query the member's join date from the database
    const memberResult = await db
      .select({ joinedAt: villageMembers.joinedAt })
      .from(villageMembers)
      .where(eq(villageMembers.id, memberId))
      .limit(1);

    if (memberResult.length === 0) {
      return 0; // Member not found
    }

    const joinDate = memberResult[0].joinedAt;
    if (!joinDate) {
      return 0; // No join date recorded
    }

    return Date.now() - joinDate.getTime(); // Return milliseconds in village
  }

  private async checkGuardianNomination(memberId: string, profile: MemberBackboneProfile): Promise<void> {
    // Guardian nomination: Steward (40-59) → Guardian (60-79)
    // Requires: High stewardship potential AND leadership index from games
    if (profile.ubuntuScore >= 40 && profile.ubuntuScore <= 59) {
      if (profile.gameSignals?.stewardship_potential && profile.gameSignals.stewardship_potential > 75) {
        // Create nomination for social validation (Phase 15 implementation)
        await this.createGuardianNomination(memberId, profile.gameSignals);
        console.log(`Member ${memberId} nominated for Guardian promotion`);
      }
    }
  }

  private async executePromotion(
    memberId: string,
    oldLevel: string,
    newLevel: string,
    path: string,
    gameSignals?: GameBehavioralSignals
  ): Promise<void> {
    // Set appropriate score for new level
    const newScore = newLevel === 'contributor' ? 25 : 65;

    // Update the member's Ubuntu score in the database
    await db.update(ubuntuScores)
      .set({
        score: newScore,
        updatedAt: new Date()
      })
      .where(eq(ubuntuScores.userId, memberId));

    // Log the promotion
    await db.insert(promotionLogs).values({
      memberId,
      oldLevel,
      newLevel,
      path,
      gameSignals,
    });

    // Update profile in memory
    const profile = this.memberProfiles.get(memberId);
    if (profile) {
      profile.ubuntuScore = newScore;
    }
  }

  private async createGuardianNomination(memberId: string, gameSignals: GameBehavioralSignals): Promise<void> {
    // This creates a nomination that requires social validation (Phase 15)
    // For now, we'll log it - full implementation would create a proposal
    await db.insert(promotionLogs).values({
      memberId,
      oldLevel: 'steward',
      newLevel: 'guardian',
      path: 'SOCIAL_VOTE',
      gameSignals,
    });
  }

  getAuditTrail(limit: number = 50): BackboneAuditEntry[] {
    return this.auditTrail.slice(-limit);
  }

  checkMemberEligibility(memberId: string): {
    eligible: boolean;
    reason?: string;
    currentScore: number;
    requiredScore: number;
  } {
    const profile = this.memberProfiles.get(memberId);
    
    if (!profile) {
      return {
        eligible: false,
        reason: 'Member data not synced. Please connect your bank account.',
        currentScore: 0,
        requiredScore: this.state.entryThreshold,
      };
    }

    if (this.state.currentMode === 'emergency') {
      return {
        eligible: profile.ubuntuScore >= this.config.elderThreshold,
        reason: 'Emergency mode active. Only Village Elders may participate.',
        currentScore: profile.ubuntuScore,
        requiredScore: this.config.elderThreshold,
      };
    }

    if (profile.riskLevel === 'critical') {
      return {
        eligible: false,
        reason: 'Risk assessment indicates critical level. Please contact support.',
        currentScore: profile.ubuntuScore,
        requiredScore: this.state.entryThreshold,
      };
    }

    const eligible = profile.ubuntuScore >= this.state.entryThreshold;
    
    return {
      eligible,
      reason: eligible ? undefined : `Ubuntu Score ${profile.ubuntuScore} is below threshold ${this.state.entryThreshold}`,
      currentScore: profile.ubuntuScore,
      requiredScore: this.state.entryThreshold,
    };
  }

  generateMatchmakerInput(memberId: string): MatchmakerInput | null {
    const profile = this.memberProfiles.get(memberId);
    
    if (!profile) return null;

    return {
      memberId,
      sanitizedProfile: profile.sanitizedProfile,
      ubuntuScore: profile.ubuntuScore,
      contributionBase: profile.contributionHistory.periods.reduce((sum, p) => sum + p.paid, 0),
      poolHealth: this.calculatePoolHealth(),
    };
  }

  private triggerEmergencyRegulation(): void {
    this.state.currentMode = 'emergency';
    this.state.entryThreshold = this.config.elderThreshold;

    this.recordAuditEntry({
      trigger: 'emergency_trigger',
      reasoning: 'Safety Buffer dropped below critical threshold',
      action: 'emergency',
      thresholdBefore: this.state.entryThreshold,
      thresholdAfter: this.config.elderThreshold,
      mode: 'emergency',
    });

    lindiweAI.applyLearning('failure', 'buffer_weight');

    this.notifyOpenClaw({
      type: 'EMERGENCY',
      mode: 'emergency',
      buffer: {
        current: this.state.safetyBuffer.currentBalance,
        target: this.state.safetyBuffer.targetBalance,
        healthRatio: this.state.safetyBuffer.healthRatio,
      },
      reasoning: 'Safety Buffer dropped below critical threshold',
      riskFlags: ['CRITICAL_BUFFER', 'EMERGENCY_TRIGGERED'],
      confidence: 0.95,
      timestamp: new Date().toISOString(),
    });
  }

  private async notifyOpenClaw(notification: OpenClawNotification): Promise<void> {
    await openClawGateway.notifyStateChange(notification);
  }

  private recordAuditEntry(entry: Omit<BackboneAuditEntry, 'id' | 'timestamp' | 'bufferState'>): void {
    this.auditTrail.push({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      bufferState: { ...this.state.safetyBuffer },
      ...entry,
    });

    if (this.auditTrail.length > 500) {
      this.auditTrail.shift();
    }
  }

  private calculatePoolHealth(): number {
    if (this.state.safetyBuffer.currentBalance <= 0) return 0;
    
    const bufferHealth = Math.min(1, this.state.safetyBuffer.currentBalance / this.config.safetyBufferTarget);
    const pulseHealth = this.state.villagePulse.stability;
    const memberHealth = this.memberProfiles.size > 0 
      ? this.memberProfiles.values().reduce((sum, p) => sum + p.ubuntuScore, 0) / this.memberProfiles.size / 100
      : 0.5;

    return Math.round((bufferHealth * 0.5 + pulseHealth * 0.3 + memberHealth * 0.2) * 100);
  }

  private calculateDefaultRate(): number {
    if (this.memberProfiles.size === 0) return 0;
    
    const criticalCount = Array.from(this.memberProfiles.values())
      .filter(p => p.riskLevel === 'critical' || p.riskLevel === 'high').length;
    
    return criticalCount / this.memberProfiles.size;
  }

  private calculateContributionRate(): number {
    if (this.memberProfiles.size === 0) return 0;
    
    const totalPaid = Array.from(this.memberProfiles.values())
      .reduce((sum, p) => sum + p.contributionHistory.periods.reduce((s, per) => s + per.paid, 0), 0);
    
    const totalRequired = Array.from(this.memberProfiles.values())
      .reduce((sum, p) => sum + p.contributionHistory.periods.reduce((s, per) => s + per.required, 0), 0);

    return totalRequired > 0 ? totalPaid / totalRequired : 0;
  }

  private determineRecentOutcomes(): 'success' | 'failure' | 'mixed' {
    const recentAudit = this.auditTrail.slice(-10);
    const failures = recentAudit.filter(e => e.action === 'emergency' || e.action === 'tighten').length;
    const successes = recentAudit.filter(e => e.action === 'expand').length;

    if (failures > successes * 2) return 'failure';
    if (successes > failures * 2) return 'success';
    return 'mixed';
  }

  private getDefaultStartDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split('T')[0];
  }

  private deriveContributionHistory(transactions: BankTransaction[], memberId?: string): MemberContributionHistory {
    const periods: { period: number; required: number; paid: number; ontime: boolean; missed: boolean }[] = [];
    
    const sortedTransactions = transactions.sort((a, b) => a.date.localeCompare(b.date));
    const incomeTransactions = sortedTransactions.filter(t => t.amount > 0);
    
    if (incomeTransactions.length === 0) {
      return { memberId: memberId || '', poolId: '', periods: [], windowDays: 90 };
    }

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const monthlyIncome = totalIncome / 3;
    const monthlyContribution = Math.min(monthlyIncome * 0.1, 500);

    const deterministicRandom = this.createSeededRandom(memberId || 'default');
    const baseRandomValue = deterministicRandom();
    
    for (let i = 0; i < 6; i++) {
      const periodSeed = (baseRandomValue * 1000 + i) % 100;
      const hasContribution = periodSeed > 15;
      const paid = hasContribution ? monthlyContribution : 0;
      const ontime = hasContribution && (periodSeed % 10) > 1;
      const missed = !hasContribution;

      periods.push({
        period: i + 1,
        required: monthlyContribution,
        paid,
        ontime,
        missed,
      });
    }

    return {
      memberId: memberId || '',
      poolId: '',
      periods,
      windowDays: 90,
    };
  }

  private createSeededRandom(seed?: string): () => number {
    let hash = 0;
    const seedStr = seed || Date.now().toString();
    for (let i = 0; i < seedStr.length; i++) {
      const char = seedStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return function() {
      hash = (hash * 1103515245 + 12345) & 0x7fffffff;
      return hash / 0x7fffffff;
    };
  }

  private calculateTotalDeposits(transactions: BankTransaction[]): number {
    return transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  }

  private calculateTotalWithdrawals(transactions: BankTransaction[]): number {
    return Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
  }

  private calculateCommunitySupport(transactions: BankTransaction[]): number {
    const communityKeywords = ['stokvel', 'savings', 'contribution', 'co-op', 'community'];
    const communityTx = transactions.filter(t => 
      communityKeywords.some(kw => t.name.toLowerCase().includes(kw))
    );
    return communityTx.length;
  }
}

export const ubuntuBackbone = new UbuntuBackbone();
