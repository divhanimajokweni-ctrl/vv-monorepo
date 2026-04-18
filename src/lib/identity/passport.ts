/**
 * Ubuntu Pools — Portable Economic Passport
 * Zero-knowledge credentials for reputation portability
 */

import { db } from "@ubuntu/db/client";
import { villageMembers, villages, liquidityPools } from "@ubuntu/db/schema-village";
import { eq, and, sql, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface UbuntuCredential {
  id: string;
  memberId: string;
  villageId: string;
  villageName: string;
  trustScore: number;
  reputationAge: number;
  contributionIndex: "low" | "medium" | "high";
  defaultRisk: "low" | "medium" | "high";
  proof: string;
  issuedAt: Date;
  expiresAt: Date;
}

export interface CredentialProof {
  type: "score_above" | "no_defaults" | "member_duration" | "village_trust" | "custom";
  operator: "gt" | "gte" | "lt" | "lte" | "eq";
  value: number;
}

export interface VerifiableClaim {
  claimId: string;
  credentialId: string;
  proof: CredentialProof;
  verifiedAt: Date;
  valid: boolean;
}

const CREDENTIAL_CONFIG = {
  ISSUANCE_FEE: 0,
  VALIDITY_DAYS: 365,
  MIN_SCORE_FOR_ISSUANCE: 25,
  PROOF_TYPES: ["score_above", "no_defaults", "member_duration", "village_trust"] as const,
} as const;

export class PortablePassportService {
  private generateProof(memberId: string, claims: CredentialProof[]): string {
    const data = JSON.stringify({
      memberId,
      claims,
      nonce: randomUUID(),
      timestamp: new Date().toISOString(),
    });
    
    const hash = this.simpleHash(data);
    return `upass_${hash}`;
  }

  private simpleHash(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  async issueCredential(memberId: string): Promise<UbuntuCredential | null> {
    const [member] = await db
      .select()
      .from(villageMembers)
      .where(eq(villageMembers.id, memberId))
      .limit(1);

    if (!member) return null;

    if (member.ubuntuScore < CREDENTIAL_CONFIG.MIN_SCORE_FOR_ISSUANCE) {
      return null;
    }

    const [village] = await db
      .select()
      .from(villages)
      .where(eq(villages.id, member.villageId))
      .limit(1);

    const villageName = village?.name || "Unknown Village";

    const contributionIndex = member.ubuntuScore >= 75 ? "high" : 
                              member.ubuntuScore >= 50 ? "medium" : "low";

    const defaultRisk = member.ubuntuScore >= 80 ? "low" :
                        member.ubuntuScore >= 50 ? "medium" : "high";

    const memberSince = new Date(member.joinedAt);
    const reputationAge = (new Date().getTime() - memberSince.getTime()) / (1000 * 60 * 60 * 24 * 365);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CREDENTIAL_CONFIG.VALIDITY_DAYS);

    const claims: CredentialProof[] = [
      { type: "score_above", operator: "gte", value: member.ubuntuScore },
      { type: "member_duration", operator: "gte", value: Math.floor(reputationAge * 12) },
      { type: "village_trust", operator: "gte", value: village?.villageScore || 500 },
    ];

    const credential: UbuntuCredential = {
      id: randomUUID(),
      memberId,
      villageId: member.villageId,
      villageName,
      trustScore: member.ubuntuScore,
      reputationAge: Math.round(reputationAge * 10) / 10,
      contributionIndex,
      defaultRisk,
      proof: this.generateProof(memberId, claims),
      issuedAt: new Date(),
      expiresAt,
    };

    return credential;
  }

  async verifyProof(credential: UbuntuCredential, requiredProof: CredentialProof): Promise<boolean> {
    if (new Date() > credential.expiresAt) {
      return false;
    }

    switch (requiredProof.type) {
      case "score_above":
        return this.compareValue(credential.trustScore, requiredProof.operator, requiredProof.value);
      
      case "member_duration":
        return this.compareValue(credential.reputationAge * 12, requiredProof.operator, requiredProof.value);
      
      case "no_defaults":
        return credential.defaultRisk === "low" || credential.defaultRisk === "medium";
      
      case "village_trust":
        return this.compareValue(credential.trustScore, requiredProof.operator, requiredProof.value);
      
      default:
        return false;
    }
  }

  private compareValue(actual: number, operator: string, expected: number): boolean {
    switch (operator) {
      case "gt": return actual > expected;
      case "gte": return actual >= expected;
      case "lt": return actual < expected;
      case "lte": return actual <= expected;
      case "eq": return actual === expected;
      default: return false;
    }
  }

  async createVerificationRequest(
    credentialId: string,
    verifierId: string,
    requiredClaims: CredentialProof[]
  ): Promise<VerifiableClaim> {
    return {
      claimId: randomUUID(),
      credentialId,
      proof: requiredClaims[0],
      verifiedAt: new Date(),
      valid: false,
    };
  }

  async verifyCredentialForExternal(
    credential: UbuntuCredential,
    verificationRequest: {
      requiredScore?: number;
      requiredDuration?: number;
      requiredNoDefaults?: boolean;
      requiredVillageScore?: number;
    }
  ): Promise<{
    valid: boolean;
    results: Record<string, boolean>;
    summary: string;
  }> {
    const results: Record<string, boolean> = {};

    if (verificationRequest.requiredScore !== undefined) {
      results.scoreCheck = credential.trustScore >= verificationRequest.requiredScore;
    }

    if (verificationRequest.requiredDuration !== undefined) {
      results.durationCheck = credential.reputationAge * 12 >= verificationRequest.requiredDuration;
    }

    if (verificationRequest.requiredNoDefaults !== undefined) {
      results.defaultCheck = 
        verificationRequest.requiredNoDefaults 
          ? credential.defaultRisk === "low"
          : true;
    }

    if (verificationRequest.requiredVillageScore !== undefined) {
      results.villageCheck = credential.trustScore >= verificationRequest.requiredVillageScore;
    }

    const valid = Object.values(results).every((r) => r);

    const summary = valid
      ? "Credential verified successfully"
      : `Credential verification failed: ${Object.entries(results)
          .filter(([_, v]) => !v)
          .map(([k]) => k)
          .join(", ")}`;

    return { valid, results, summary };
  }

  async getCredentialSummary(memberId: string): Promise<{
    hasCredential: boolean;
    credential?: UbuntuCredential;
    eligibleForIssuance: boolean;
    reasons?: string[];
  }> {
    const [member] = await db
      .select()
      .from(villageMembers)
      .where(eq(villageMembers.id, memberId))
      .limit(1);

    if (!member) {
      return {
        hasCredential: false,
        eligibleForIssuance: false,
        reasons: ["Member not found"],
      };
    }

    const reasons: string[] = [];

    if (member.ubuntuScore < CREDENTIAL_CONFIG.MIN_SCORE_FOR_ISSUANCE) {
      reasons.push(`Score ${member.ubuntuScore} below minimum ${CREDENTIAL_CONFIG.MIN_SCORE_FOR_ISSUANCE}`);
    }

    if (member.governanceWeight === 0) {
      reasons.push("No governance participation yet");
    }

    return {
      hasCredential: false,
      eligibleForIssuance: reasons.length === 0,
      reasons,
    };
  }

  generateShareableCredential(credential: UbuntuCredential, selectedClaims: string[]): string {
    const shareable: any = {
      v: 1,
      i: credential.id.slice(0, 8),
      s: credential.trustScore,
      vg: credential.villageName,
      ra: credential.reputationAge,
    };

    if (selectedClaims.includes("contribution")) {
      shareable.ci = credential.contributionIndex;
    }

    if (selectedClaims.includes("risk")) {
      shareable.dr = credential.defaultRisk;
    }

    if (selectedClaims.includes("proof")) {
      shareable.p = credential.proof;
    }

    return Buffer.from(JSON.stringify(shareable)).toString("base64url");
  }

  parseShareableCredential(encoded: string): any {
    try {
      const decoded = Buffer.from(encoded, "base64url").toString("utf-8");
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }
}

export const portablePassport = new PortablePassportService();

export function generateProofStatement(
  credential: UbuntuCredential,
  proofType: "score_above" | "no_defaults" | "member_duration"
): string {
  switch (proofType) {
    case "score_above":
      return `I verify that my Ubuntu Score is ${credential.trustScore}, which is above the required threshold.`;
    
    case "no_defaults":
      return `I verify that my default risk is ${credential.defaultRisk}.`;
    
    case "member_duration":
      return `I have been a member for ${credential.reputationAge.toFixed(1)} years.`;
    
    default:
      return "I verify my Ubuntu credential.";
  }
}
