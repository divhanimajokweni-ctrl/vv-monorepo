// File: packages/safestakes/src/core/escrow-custody.ts
// Purpose: Capital custody with SafeKrypte as arbiter.
// SafeStakes holds funds, SafeKrypte authorizes release.
// Neither can unilaterally move escrowed capital.

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
 * THE ESCROW CUSTODY CONTRACT
 *
 * SafeStakes holds the funds (custodian).
 * SafeKrypte authorizes release (arbiter).
 * Neither role can perform the other's function.
 * This is the separation-of-powers for capital at rest.
 */
class EscrowCustodian {
  private escrow: EscrowAgreement;
  private state: EscrowState = EscrowState.ACTIVE;
  private releaseAuthorizations: EscrowReleaseAuthorization[] = [];

  constructor(escrow: EscrowAgreement) {
    this.escrow = escrow;
    this.validateEscrow();
  }

  /**
   * Validate escrow agreement constraints
   */
  private validateEscrow(): void {
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

  getEscrow(): EscrowAgreement {
    return this.escrow;
  }
}

export { EscrowCustodian, EscrowState };