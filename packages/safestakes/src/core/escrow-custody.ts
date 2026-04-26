// File: packages/safestakes/src/core/escrow-custody.ts
// Purpose: Trust escrow for BayWater community profit sharing.
// Holds 15% community profit share in multisig escrow.
// Automatic distributions to QCOs via verified metrics.

import type {
  EscrowAgreement,
  EscrowReleaseAuthorization,
  IncidentReport,
} from '@contracts/schemas';

/**
 * Escrow states
 */
enum EscrowState {
  /** Funds deposited, awaiting release condition */
  ACTIVE = 'ACTIVE',
  /** Release condition met, arbiter has signed */
  RELEASE_AUTHORIZED = 'RELEASE_AUTHORIZED',
  /** Funds transferred to beneficiary */
  RELEASED = 'RELEASED',
  /** Expired without release, funds returned to depositor */
  RETURNED = 'RETURNED',
  /** Disputed — requires governance resolution */
  DISPUTED = 'DISPUTED',
}

/**
 * BayWater Trust Escrow Configuration
 */
interface BayWaterTrustConfig {
  arbiter: string;
  beneficiaries: string[];
  releaseConditions: {
    metric_threshold: string;
    audit_pass: boolean;
  };
}

/**
 * THE ESCROW CUSTODY CONTRACT
 *
 * For BayWater: Trust escrow holds community profit share.
 * Multisig arbiter authorizes automatic distributions to QCOs.
 * Distributions triggered by verified water savings metrics.
 */
class EscrowCustodian {
  private escrow: EscrowAgreement | null = null;
  private trustConfig: BayWaterTrustConfig | null = null;
  private state: EscrowState = EscrowState.ACTIVE;
  private releaseAuthorizations: EscrowReleaseAuthorization[] = [];

  constructor(config?: BayWaterTrustConfig | EscrowAgreement) {
    if (this.isBayWaterConfig(config)) {
      this.trustConfig = config;
      this.validateTrustConfig();
    } else if (config) {
      this.escrow = config;
      this.validateEscrow();
    }
  }

  private isBayWaterConfig(config: any): config is BayWaterTrustConfig {
    return config && config.arbiter && config.beneficiaries && config.releaseConditions;
  }

  /**
   * Validate escrow agreement constraints
   */
  private validateEscrow(): void {
    if (!this.escrow) return;

    // Depositor must have signed the agreement
    if (!this.escrow.depositorSignature) {
      throw new Error('Escrow agreement must be signed by depositor');
    }

    // Amount must be positive
    if (this.escrow.amountCents <= 0) {
      throw new Error('Escrow amount must be positive');
    }

    // Must have expiry
    if (!this.escrow.expiresAt || this.escrow.expiresAt <= Date.now()) {
      throw new Error('Escrow must have future expiry');
    }

    // Must reference valid pool
    if (!this.escrow.poolId) {
      throw new Error('Escrow must reference a valid pool');
    }

    console.log(`[ESCROW] Validated: ${this.escrow.escrowId}`);
    console.log(`   Amount: ${this.escrow.amountCents} ${this.escrow.currency}`);
    console.log(`   Depositor: ${this.escrow.depositorPubKey.substring(0, 20)}...`);
    console.log(`   Beneficiary: ${this.escrow.beneficiaryPubKey.substring(0, 20)}...`);
    console.log(`   Expires: ${new Date(this.escrow.expiresAt).toISOString()}`);
  }

  /**
   * Validate BayWater trust configuration
   */
  private validateTrustConfig(): void {
    if (!this.trustConfig) return;

    if (!this.trustConfig.arbiter) {
      throw new Error('Trust escrow must have arbiter');
    }

    if (!this.trustConfig.beneficiaries || this.trustConfig.beneficiaries.length === 0) {
      throw new Error('Trust escrow must have beneficiaries');
    }

    console.log(`[TRUST ESCROW] BayWater Community Trust configured`);
    console.log(`   Arbiter: ${this.trustConfig.arbiter}`);
    console.log(`   Beneficiaries: ${this.trustConfig.beneficiaries.join(', ')}`);
    console.log(`   Conditions: ${this.trustConfig.releaseConditions.metric_threshold}, audit_pass: ${this.trustConfig.releaseConditions.audit_pass}`);
  }

  /**
   * Request release — arbiter (SafeKrypte) must sign
   */
  async requestRelease(reason: string): Promise<EscrowReleaseAuthorization | null> {
    if (this.state !== EscrowState.ACTIVE) {
      console.error(`[ESCROW] Cannot release: escrow is ${this.state}`);
      return null;
    }

    // Check release condition
    const conditionMet = await this.checkReleaseCondition();
    if (!conditionMet) {
      console.error(`[ESCROW] Release condition not met`);
      return null;
    }

    // Build release authorization
    const authorization: EscrowReleaseAuthorization = {
      escrowId: this.escrow.escrowId,
      releaseId: `release-${this.escrow.escrowId}-${Date.now()}`,
      authorizedBy: '', // Filled after SafeKrypte signs
      releaseReason: reason,
      releaseAmountCents: this.escrow.amountCents,
      timestamp: Date.now(),
      signature: '',
    };

    // Request SafeKrypte signature (arbiter)
    const arbiterSignature = await this.requestArbiterSignature(authorization);
    if (!arbiterSignature) {
      console.error(`[ESCROW] Arbiter refused to sign release`);
      return null;
    }

    authorization.authorizedBy = '0xsafekrypte-arbiter-key';
    authorization.signature = arbiterSignature;

    // Verify arbiter signature
    const signatureValid = await this.verifyArbiterSignature(authorization);
    if (!signatureValid) {
      console.error(`[ESCROW] Arbiter signature verification failed`);
      return null;
    }

    this.state = EscrowState.RELEASE_AUTHORIZED;
    this.releaseAuthorizations.push(authorization);

    console.log(`[ESCROW] Release authorized: ${authorization.releaseId}`);
    return authorization;
  }

  /**
   * Execute release — transfer funds to beneficiary
   */
  async executeRelease(authorization: EscrowReleaseAuthorization): Promise<boolean> {
    // Verify authorization
    if (authorization.escrowId !== this.escrow.escrowId) {
      console.error(`[ESCROW] Authorization escrowId mismatch`);
      return false;
    }

    if (this.state !== EscrowState.RELEASE_AUTHORIZED) {
      console.error(`[ESCROW] Cannot execute: escrow is ${this.state}`);
      return false;
    }

    // Verify arbiter signature again (defense in depth)
    const signatureValid = await this.verifyArbiterSignature(authorization);
    if (!signatureValid) {
      console.error(`[ESCROW] Arbiter signature invalid at execution time`);
      return false;
    }

    // TRANSFER FUNDS
    console.log(`[ESCROW] Transferring ${authorization.releaseAmountCents} to ${this.escrow.beneficiaryPubKey.substring(0, 20)}...`);

    // In production: atomic transfer on SafeStakes
    const transferSuccess = await this.transferFunds(
      this.escrow.poolId,
      this.escrow.beneficiaryPubKey,
      authorization.releaseAmountCents
    );

    if (!transferSuccess) {
      console.error(`[ESCROW] Fund transfer failed`);
      return false;
    }

    this.state = EscrowState.RELEASED;
    console.log(`[ESCROW] ✅ Funds released: ${authorization.releaseId}`);

    return true;
  }

  /**
   * Expire escrow — return funds to depositor
   */
  async expireIfPastDue(): Promise<boolean> {
    if (this.state !== EscrowState.ACTIVE) {
      return false;
    }

    if (Date.now() <= this.escrow.expiresAt) {
      return false; // Not yet expired
    }

    console.log(`[ESCROW] Escrow expired — returning funds to depositor`);

    // Return funds to depositor
    const returnSuccess = await this.transferFunds(
      this.escrow.poolId,
      this.escrow.depositorPubKey,
      this.escrow.amountCents
    );

    if (returnSuccess) {
      this.state = EscrowState.RETURNED;
      console.log(`[ESCROW] ✅ Funds returned to depositor`);
      return true;
    }

    return false;
  }

  /**
   * Prevent double release — idempotency check
   */
  async isDoubleRelease(authorization: EscrowReleaseAuthorization): Promise<boolean> {
    return this.releaseAuthorizations.some(
      a => a.releaseId !== authorization.releaseId &&
           a.escrowId === authorization.escrowId
    );
  }

  // ── Helpers ──

  private async checkReleaseCondition(): Promise<boolean> {
    const condition = this.escrow.releaseCondition;

    switch (condition.type) {
      case 'SIGNED_INCIDENT': {
        const incidentReportId = condition.params.incidentReportId as string;
        // Check that this incident exists and was executed
        const response = await fetch(`http://localhost:3002/execution-ledger/${incidentReportId}`);
        const result = await response.json();
        return result.executed === true;
      }

      case 'TIME_LOCK': {
        const releaseAfter = condition.params.releaseAfter as number;
        return Date.now() >= releaseAfter;
      }

      case 'MULTI_SIG': {
        const requiredSigners = condition.params.requiredSigners as number;
        return this.releaseAuthorizations.length >= requiredSigners;
      }

      case 'GOVERNANCE_VOTE': {
        const voteId = condition.params.voteId as string;
        const response = await fetch(`http://localhost:3002/governance/${voteId}`);
        const result = await response.json();
        return result.passed === true;
      }

      default:
        return false;
    }
  }

  private async requestArbiterSignature(
    authorization: Omit<EscrowReleaseAuthorization, 'signature' | 'authorizedBy'>
  ): Promise<string | null> {
    const response = await fetch('http://localhost:3001/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload: {
          escrowId: authorization.escrowId,
          releaseId: authorization.releaseId,
          releaseReason: authorization.releaseReason,
          releaseAmountCents: authorization.releaseAmountCents,
          timestamp: authorization.timestamp,
        },
        keyId: 'safekrypte-arbiter-key',
      }),
    });
    const result = await response.json();
    return result.signature || null;
  }

  private async verifyArbiterSignature(
    authorization: EscrowReleaseAuthorization
  ): Promise<boolean> {
    const response = await fetch('http://localhost:3001/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload: {
          escrowId: authorization.escrowId,
          releaseId: authorization.releaseId,
          releaseReason: authorization.releaseReason,
          releaseAmountCents: authorization.releaseAmountCents,
          timestamp: authorization.timestamp,
        },
        signature: authorization.signature,
        signerPubKey: authorization.authorizedBy,
      }),
    });
    const result = await response.json();
    return result.valid;
  }

  private async transferFunds(
    poolId: string,
    recipientPubKey: string,
    amountCents: number
  ): Promise<boolean> {
    const response = await fetch('http://localhost:3002/execute-slash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        poolId,
        recipientPubKey,
        amountCents,
        idempotencyKey: `escrow-transfer-${Date.now()}`,
      }),
    });
    const result = await response.json();
    return result.executed === true;
  }

  getState(): EscrowState {
    return this.state;
  }

  getEscrow(): EscrowAgreement | null {
    return this.escrow;
  }

  /**
   * BayWater: Automatic monthly distribution of community profit share
   */
  async distribute(profitShareAmount: number): Promise<boolean> {
    if (!this.trustConfig) {
      console.error('[TRUST ESCROW] Not configured for BayWater trust distribution');
      return false;
    }

    // Check release conditions
    const conditionsMet = await this.checkTrustReleaseConditions();
    if (!conditionsMet) {
      console.log('[TRUST ESCROW] Release conditions not met - skipping distribution');
      return false;
    }

    console.log(`[TRUST ESCROW] Distributing ${profitShareAmount} to ${this.trustConfig.beneficiaries.length} QCOs`);

    // Distribute equally among beneficiaries
    const sharePerBeneficiary = profitShareAmount / this.trustConfig.beneficiaries.length;

    for (const beneficiary of this.trustConfig.beneficiaries) {
      const success = await this.distributeToBeneficiary(beneficiary, sharePerBeneficiary);
      if (!success) {
        console.error(`[TRUST ESCROW] Failed to distribute to ${beneficiary}`);
        return false;
      }
    }

    console.log('[TRUST ESCROW] ✅ Community profit share distributed successfully');
    return true;
  }

  /**
   * Check BayWater trust release conditions
   */
  private async checkTrustReleaseConditions(): Promise<boolean> {
    if (!this.trustConfig) return false;

    // Check metric threshold (e.g., water_savings > 15%)
    const metricCheck = await this.checkMetricThreshold(this.trustConfig.releaseConditions.metric_threshold);

    // Check audit pass
    const auditCheck = this.trustConfig.releaseConditions.audit_pass;

    return metricCheck && auditCheck;
  }

  /**
   * Check if metric threshold is met
   */
  private async checkMetricThreshold(threshold: string): Promise<boolean> {
    // Parse threshold like "water_savings > 15%"
    const [metric, operator, valueStr] = threshold.split(' ');
    const targetValue = parseFloat(valueStr.replace('%', '')) / 100;

    // Query latest metrics from mainframe
    try {
      const response = await fetch('http://localhost:3003/metrics/latest');
      const metrics = await response.json();

      // Simple check - in production would evaluate the expression
      const currentValue = metrics[metric] || 0;
      return operator === '>' ? currentValue > targetValue : currentValue >= targetValue;
    } catch (error) {
      console.error('[TRUST ESCROW] Failed to check metric threshold:', error);
      return false;
    }
  }

  /**
   * Distribute share to individual beneficiary
   */
  private async distributeToBeneficiary(beneficiary: string, amount: number): Promise<boolean> {
    // Use Stitch/Ozow for distribution as mentioned in blueprint
    try {
      const response = await fetch('https://api.stitch.money/v1/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiary,
          amount,
          currency: 'ZAR',
          reference: `baywater-qco-share-${Date.now()}`
        }),
      });

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error(`[TRUST ESCROW] Distribution failed for ${beneficiary}:`, error);
      return false;
    }
  }
}

export { EscrowCustodian, EscrowState, type BayWaterTrustConfig };