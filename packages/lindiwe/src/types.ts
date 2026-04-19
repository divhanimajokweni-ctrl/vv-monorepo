/**
 * Lindiwe AI Package — Type Definitions
 */

export interface GameBehavioralSignals {
  risk_appetite: number;
  cooperative_quotient: number;
  stress_response: number;
  leadership_index: number;
  overextension: number;
  knowledge_score: number;
  stewardship_potential: number; // Derived from leadership_index + cooperative_quotient
}

export interface SanitizedProfile {
  id: string;
  name: string;
  aggregatedScore?: number;
  intentTags?: string[];
  memberId?: string;
}

export interface IntentTag {
  category: string;
  strength: number;
}

export interface SybilSignals {
  deviceFingerprint: string;
  behavioralPattern: string;
  networkGraph: string;
  temporalConsistency: string;
  verificationLevel: "none" | "basic" | "verified" | "trusted";
}

export interface VerificationLevelSchema {
  level: "none" | "basic" | "verified" | "trusted";
  requirements: string[];
  benefits: string[];
}
