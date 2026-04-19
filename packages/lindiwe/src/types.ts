/**
 * Lindiwe AI Package — Type Definitions
 */

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
  verificationLevel: 'none' | 'basic' | 'verified' | 'trusted';
}

export interface VerificationLevelSchema {
  level: 'none' | 'basic' | 'verified' | 'trusted';
  requirements: string[];
  benefits: string[];
}