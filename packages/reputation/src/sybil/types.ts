import { z } from "zod";

export const SybilSignalsSchema = z.object({
  deviceBinding: z.number().min(0).max(1),
  humanVerification: z.number().min(0).max(1),
  socialAnchor: z.number().min(0).max(1),
  economicActivity: z.number().min(0).max(1),
  graphAnalysis: z.number().min(0).max(1),
  transactionFriction: z.number().min(0).max(1),
  reputationGrowth: z.number().min(0).max(1),
  interactionDiversity: z.number().min(0).max(1),
  timeTrust: z.number().min(0).max(1),
  villageShield: z.number().min(0).max(1),
});

export type SybilSignals = z.infer<typeof SybilSignalsSchema>;

export const VerificationLevelSchema = z.enum([
  "level_0",
  "level_1",
  "level_2",
  "level_3",
]);

export type VerificationLevel = z.infer<typeof VerificationLevelSchema>;

export const SybilVerdictTypeSchema = z.enum([
  "trusted",
  "provisional",
  "suspicious",
  "blocked",
]);

export type SybilVerdictType = z.infer<typeof SybilVerdictTypeSchema>;

export interface SybilVerdict {
  userId: string;
  score: number;
  verdict: SybilVerdictType;
  signals: SybilSignals;
  permissions: string[];
  flags: string[];
}

export interface InvitationChain {
  userId: string;
  sponsorId: string | null;
  depth: number;
  chainScore: number;
}
