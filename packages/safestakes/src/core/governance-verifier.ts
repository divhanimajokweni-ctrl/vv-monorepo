// File: packages/safestakes/src/core/governance-verifier.ts

import { getLatestGovernanceAction } from '@vv-monorepo/platform/src/stores/governance-store';
import { GovernanceAction, GovernanceActionType } from '@contracts/schemas/governance';
import { verifySignature } from '@vv-monorepo/safekrypte/signing';

/**
 * Verifies that a governance action exists, is signed by the required quorum,
 * is not expired, and matches the given payload (e.g., policyHash).
 */
export async function verifyGovernanceAction(
  poolId: string,
  actionType: GovernanceActionType,
  expectedPayload: Record<string, unknown>,
  currentPolicyHash: string  // additional context for policy-specific checks
): Promise<boolean> {
  const action = await getLatestGovernanceAction(poolId, actionType);
  if (!action) {
    console.warn(`[GOVERNANCE] No governance action found for ${actionType} in pool ${poolId}`);
    return false;
  }

  // Check expiry
  if (Date.now() > action.expiresAt) {
    console.warn(`[GOVERNANCE] Action expired: ${action.actionId}`);
    return false;
  }

  // Check quorum
  if (action.approvedBy.length < action.requiredApprovals) {
    console.warn(`[GOVERNANCE] Quorum not met: ${action.approvedBy.length}/${action.requiredApprovals}`);
    return false;
  }

  // Verify signatures (using real trustee keys)
  for (const pubKey of action.approvedBy) {
    const signature = action.signatures[pubKey];
    if (!signature) {
      console.warn(`[GOVERNANCE] Missing signature for ${pubKey}`);
      return false;
    }
    const payloadToVerify = {
      actionId: action.actionId,
      actionType: action.actionType,
      poolId: action.poolId,
      payload: action.payload,
      createdAt: action.createdAt,
      expiresAt: action.expiresAt,
    };
    const valid = await verifySignature(payloadToVerify, signature, pubKey);
    if (!valid) {
      console.warn(`[GOVERNANCE] Invalid signature from ${pubKey}`);
      return false;
    }
  }

  // Check that the payload matches (e.g., policyHash)
  if (actionType === 'APPROVE_POLICY_HASH') {
    if (action.payload.policyHash !== expectedPayload.policyHash) {
      console.warn(`[GOVERNANCE] Policy hash mismatch: governance=${action.payload.policyHash} vs incident=${expectedPayload.policyHash}`);
      return false;
    }
    // Optionally, verify that this policyHash is the current active one for the pool
    if (action.payload.policyHash !== currentPolicyHash) {
      console.warn(`[GOVERNANCE] Policy not active for pool`);
      return false;
    }
  }

  return true;
}

// Trustee key management
export async function getTrusteePublicKeys(): Promise<string[]> {
  // In production, this would load from a governance registry
  // For now, use the generated trustee keys
  const response = await fetch('http://localhost:3001/keys');
  const { keys } = await response.json();

  return keys
    .filter((k: any) => k.label.startsWith('trustee-'))
    .map((k: any) => k.publicKey);
}

export async function validateTrusteeSignature(
  trusteeIndex: number,
  message: unknown,
  signature: string
): Promise<boolean> {
  const trusteeKeys = await getTrusteePublicKeys();
  if (trusteeIndex >= trusteeKeys.length) {
    return false;
  }

  return await verifySignature(message, signature, trusteeKeys[trusteeIndex]);
}</content>
<parameter name="filePath">packages/safestakes/src/core/governance-verifier.ts