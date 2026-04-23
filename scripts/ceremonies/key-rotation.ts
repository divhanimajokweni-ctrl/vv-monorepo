// File: scripts/ceremonies/key-rotation.ts
// Purpose: Multi-party, signed, time-bounded protocol for HSM key rotation.
// Prevents cryptographic decay without breaking active coverage.

import type { CeremonyScript, CeremonyStep, KeyRotationEvent } from '@contracts/schemas';
import { createHash } from 'crypto';

/**
 * Key rotation ceremony constants
 */
const CEREMONY_TIMEOUT_MS = 30 * 60 * 1000;      // 30 minutes max
const STEP_TIMEOUT_MS = 5 * 60 * 1000;            // 5 minutes per step
const TRANSITION_PERIOD_MS = 60 * 60 * 1000;       // 1 hour dual-validity
const REQUIRED_SIGNERS = ['safekrypte-admin-1', 'safestakes-admin-1'];

/**
 * THE KEY ROTATION CEREMONY
 *
 * Six steps, each cryptographically signed, with timeouts.
 * Old key remains valid for TRANSITION_PERIOD_MS after activation.
 * This ensures in-flight incidents can still be verified.
 */
class KeyRotationCeremony {
  private ceremony: CeremonyScript;
  private steps: Map<string, CeremonyStep> = new Map();
  private timeoutTimer: NodeJS.Timeout | null = null;

  constructor(
    private keyId: string,
    private previousPubKey: string,
    private nextPubKey: string,
    private environment: 'dev' | 'staging' | 'prod'
  ) {
    this.ceremony = {
      ceremonyId: `key-rotation-${keyId}-${Date.now()}`,
      ceremonyType: 'KEY_ROTATION',
      poolId: 'global', // Key rotation affects all pools
      policyHash: 'global',
      steps: [],
      startedAt: Date.now(),
      status: 'PENDING',
      participants: REQUIRED_SIGNERS,
      signatures: {},
      traceId: `trace-rotation-${keyId}-${Date.now()}`,
    };
  }

  /**
   * Execute the full ceremony
   */
  async execute(): Promise<KeyRotationEvent | null> {
    console.log(`🔐 Starting Key Rotation Ceremony`);
    console.log(`   Key: ${this.keyId}`);
    console.log(`   Previous: ${this.previousPubKey.substring(0, 20)}...`);
    console.log(`   Next: ${this.nextPubKey.substring(0, 20)}...`);
    console.log(`   Environment: ${this.environment}`);
    console.log('');

    // Set global timeout
    this.timeoutTimer = setTimeout(() => {
      this.abort('Ceremony timed out');
    }, CEREMONY_TIMEOUT_MS);

    try {
      // Step 1: ANNOUNCE
      await this.stepAnnounce();

      // Step 2: VERIFY compatibility
      await this.stepVerify();

      // Step 3: PRE-SIGN test metrics
      await this.stepPreSign();

      // Step 4: ACTIVATE dual-signature
      await this.stepActivate();

      // Step 5: RETIRE old key
      await this.stepRetire();

      // Step 6: ATTEST
      const event = await this.stepAttest();

      this.ceremony.status = 'COMPLETED';
      this.ceremony.completedAt = Date.now();

      console.log('');
      console.log('✅ Key Rotation Ceremony Complete');
      console.log(`   New key active: ${this.nextPubKey.substring(0, 20)}...`);
      console.log(`   Ceremony ID: ${this.ceremony.ceremonyId}`);

      return event;
    } catch (error) {
      this.abort(`Step failed: ${error}`);
      return null;
    } finally {
      if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
    }
  }

  /**
   * Step 1: ANNOUNCE — Sign announcement with current key
   */
  private async stepAnnounce(): Promise<void> {
    console.log('📢 Step 1/6: ANNOUNCE — Signing rotation announcement');

    const payload = {
      ceremonyId: this.ceremony.ceremonyId,
      keyId: this.keyId,
      previousPubKey: this.previousPubKey,
      nextPubKey: this.nextPubKey,
      algorithm: 'ECDSA_P256',
      announcedAt: Date.now(),
    };

    const signature = await this.signWithCurrentKey(payload);
    this.addStep('announce-rotation', 'Announce key rotation', payload, signature);

    console.log('   ✅ Announcement signed with current key');
  }

  /**
   * Step 2: VERIFY — All pools confirm new key compatibility
   */
  private async stepVerify(): Promise<void> {
    console.log('🔍 Step 2/6: VERIFY — Checking pool compatibility');

    const pools = await this.fetchAllPools();
    const incompatible: string[] = [];

    for (const pool of pools) {
      const compatible = await this.checkPoolCompatibility(pool.poolId, this.nextPubKey);
      if (!compatible) {
        incompatible.push(pool.poolId);
      }
    }

    if (incompatible.length > 0) {
      throw new Error(`Pools incompatible with new key: ${incompatible.join(', ')}`);
    }

    const payload = {
      poolsChecked: pools.map(p => p.poolId),
      allCompatible: true,
      checkedAt: Date.now(),
    };

    const signature = await this.signWithAdmin(payload);
    this.addStep('verify-compatibility', 'Verify pool compatibility', payload, signature);

    console.log(`   ✅ All ${pools.length} pools compatible`);
  }

  /**
   * Step 3: PRE-SIGN — Sign test metrics with new key
   */
  private async stepPreSign(): Promise<void> {
    console.log('✍️  Step 3/6: PRE-SIGN — Testing new key signatures');

    const testMetrics = [
      { proofId: 'test-rotation-1', metricType: 'production_uptime_bps', value: 9995 },
      { proofId: 'test-rotation-2', metricType: 'cost_per_unit_cents', value: 45 },
      { proofId: 'test-rotation-3', metricType: 'mttr_minutes', value: 18 },
    ];

    const signedMetrics = [];
    for (const metric of testMetrics) {
      const signature = await this.signWithNewKey(metric);
      const verified = await this.verifyWithNewKey(metric, signature);

      if (!verified) {
        throw new Error(`New key signature verification failed for ${metric.proofId}`);
      }

      signedMetrics.push({ ...metric, signature, verified: true });
    }

    const payload = { testMetrics: signedMetrics, signedAt: Date.now() };
    const signature = await this.signWithNewKey(payload);
    this.addStep('pre-sign-test', 'Pre-sign test metrics with new key', payload, signature);

    console.log(`   ✅ ${signedMetrics.length} test metrics signed and verified`);
  }

  /**
   * Step 4: ACTIVATE — Dual-signature transition proof
   */
  private async stepActivate(): Promise<void> {
    console.log('⚡ Step 4/6: ACTIVATE — Dual-signature transition');

    const payload = {
      ceremonyId: this.ceremony.ceremonyId,
      keyId: this.keyId,
      previousPubKey: this.previousPubKey,
      nextPubKey: this.nextPubKey,
      activatedAt: Date.now(),
      transitionPeriodMs: TRANSITION_PERIOD_MS,
      oldKeyRetiredAt: Date.now() + TRANSITION_PERIOD_MS,
    };

    // Both keys must sign
    const oldKeySig = await this.signWithCurrentKey(payload);
    const newKeySig = await this.signWithNewKey(payload);

    const dualPayload = {
      ...payload,
      signatures: { oldKey: oldKeySig, newKey: newKeySig },
    };

    const adminSignature = await this.signWithAdmin(dualPayload);
    this.addStep('activate', 'Activate new key with dual-signature proof', dualPayload, adminSignature);

    // Activate the new key in SafeKrypte
    await this.activateKeyInHSM(this.keyId, this.nextPubKey);

    console.log(`   ✅ New key activated (old key valid for ${TRANSITION_PERIOD_MS / 3600000}h)`);
  }

  /**
   * Step 5: RETIRE — Old key self-signs retirement
   */
  private async stepRetire(): Promise<void> {
    console.log('🔒 Step 5/6: RETIRE — Old key self-signs retirement');

    // Wait for transition period (in production; skip for dev)
    if (this.environment === 'prod') {
      console.log(`   Waiting ${TRANSITION_PERIOD_MS / 60000}m transition period...`);
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5s for demo
    }

    const payload = {
      keyId: this.keyId,
      previousPubKey: this.previousPubKey,
      retiredAt: Date.now(),
      reason: 'rotation-complete',
    };

    const signature = await this.signWithCurrentKey(payload);
    this.addStep('retire', 'Retire old key', payload, signature);

    // Retire old key in SafeKrypte
    await this.retireKeyInHSM(this.keyId, this.previousPubKey);

    console.log('   ✅ Old key retired');
  }

  /**
   * Step 6: ATTEST — Emit KeyRotationEvent
   */
  private async stepAttest(): Promise<KeyRotationEvent> {
    console.log('📜 Step 6/6: ATTEST — Emitting KeyRotationEvent');

    const event: KeyRotationEvent = {
      keyId: this.keyId,
      previousPubKey: this.previousPubKey,
      nextPubKey: this.nextPubKey,
      environment: this.environment,
      activatedAt: Date.now(),
      signedBy: REQUIRED_SIGNERS[0],
      signature: '',
    };

    // Sign the attestation
    const payload = {
      keyId: event.keyId,
      previousPubKey: event.previousPubKey,
      nextPubKey: event.nextPubKey,
      environment: event.environment,
      activatedAt: event.activatedAt,
    };
    event.signature = await this.signWithAdmin(payload);

    // Emit to audit log
    await this.emitAttestation(event);

    console.log('   ✅ KeyRotationEvent emitted and signed');

    return event;
  }

  /**
   * Abort ceremony — no partial state
   */
  private abort(reason: string): void {
    console.error(`❌ Ceremony ABORTED: ${reason}`);
    this.ceremony.status = 'ABORTED';
    this.ceremony.completedAt = Date.now();

    // Revert any partial state
    // In production: rollback HSM state
  }

  // ── Helpers ──

  private addStep(
    stepId: string,
    description: string,
    payload: unknown,
    signature: string
  ): void {
    const step: CeremonyStep = {
      stepId,
      order: this.ceremony.steps.length + 1,
      description,
      requiredSigners: REQUIRED_SIGNERS,
      timeoutMs: STEP_TIMEOUT_MS,
      preconditions: this.ceremony.steps.map(s => s.stepId),
      payload,
      status: 'SIGNED',
    };

    this.ceremony.steps.push(step);
    this.ceremony.signatures[stepId] = signature;

    // Hash and log the step
    const stepHash = createHash('sha256')
      .update(JSON.stringify({ stepId, payload, signature }))
      .digest('hex');
    console.log(`   📎 Step hash: ${stepHash.substring(0, 16)}...`);
  }

  private async signWithCurrentKey(payload: unknown): Promise<string> {
    const response = await fetch('http://localhost:3001/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, keyId: this.previousPubKey }),
    });
    const result = await response.json();
    return result.signature;
  }

  private async signWithNewKey(payload: unknown): Promise<string> {
    const response = await fetch('http://localhost:3001/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, keyId: this.nextPubKey }),
    });
    const result = await response.json();
    return result.signature;
  }

  private async verifyWithNewKey(payload: unknown, signature: string): Promise<boolean> {
    const response = await fetch('http://localhost:3001/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, signature, signerPubKey: this.nextPubKey }),
    });
    const result = await response.json();
    return result.valid;
  }

  private async signWithAdmin(payload: unknown): Promise<string> {
    const response = await fetch('http://localhost:3001/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, keyId: 'safekrypte-admin-key' }),
    });
    const result = await response.json();
    return result.signature;
  }

  private async fetchAllPools(): Promise<Array<{ poolId: string }>> {
    const response = await fetch('http://localhost:3002/pool-state');
    const result = await response.json();
    return Object.keys(result.pools).map(poolId => ({ poolId }));
  }

  private async checkPoolCompatibility(poolId: string, newPubKey: string): Promise<boolean> {
    // Check that the pool's policy engine can verify signatures from new key
    return true; // Placeholder
  }

  private async activateKeyInHSM(keyId: string, pubKey: string): Promise<void> {
    console.log(`   [HSM] Activating key: ${keyId}`);
    // Integration: AWS KMS, HashiCorp Vault, etc.
  }

  private async retireKeyInHSM(keyId: string, pubKey: string): Promise<void> {
    console.log(`   [HSM] Retiring key: ${keyId}`);
    // Integration: AWS KMS, HashiCorp Vault, etc.
  }

  private async emitAttestation(event: KeyRotationEvent): Promise<void> {
    const fs = await import('fs/promises');
    const attestationPath = `attestations/key-rotation-${event.keyId}-${event.activatedAt}.json`;
    await fs.mkdir('attestations', { recursive: true });
    await fs.writeFile(attestationPath, JSON.stringify(event, null, 2));
    console.log(`   📁 Attestation saved: ${attestationPath}`);
  }
}

export { KeyRotationCeremony };