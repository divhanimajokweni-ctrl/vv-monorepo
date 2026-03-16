import { z } from "zod";

export const AuthorityLevelSchema = z.enum([
  "novice",
  "contributor",
  "trusted_member",
  "elder",
  "archivist",
]);

export type AuthorityLevel = z.infer<typeof AuthorityLevelSchema>;

export const AUTHORITY_LEVELS: Record<AuthorityLevel, { minScore: number; maxScore: number; privileges: string[] }> = {
  novice: {
    minScore: 0,
    maxScore: 25,
    privileges: ["view_only", "basic_participation"],
  },
  contributor: {
    minScore: 25,
    maxScore: 50,
    privileges: ["create_proposals", "mentor_new_members"],
  },
  trusted_member: {
    minScore: 50,
    maxScore: 75,
    privileges: ["vote_on_governance", "review_content", "create_proposals", "mentor_new_members"],
  },
  elder: {
    minScore: 75,
    maxScore: 90,
    privileges: ["propose_constitutional_changes", "arbitrate_disputes", "vote_on_governance", "review_content", "create_proposals", "mentor_new_members"],
  },
  archivist: {
    minScore: 90,
    maxScore: 100,
    privileges: ["modify_protocol_parameters", "emergency_powers", "propose_constitutional_changes", "arbitrate_disputes", "vote_on_governance", "review_content", "create_proposals", "mentor_new_members"],
  },
};

export function getAuthorityLevel(score: number): AuthorityLevel {
  if (score >= 90) return "archivist";
  if (score >= 75) return "elder";
  if (score >= 50) return "trusted_member";
  if (score >= 25) return "contributor";
  return "novice";
}

export function getPrivileges(score: number): string[] {
  const level = getAuthorityLevel(score);
  return AUTHORITY_LEVELS[level].privileges;
}

export function hasPrivilege(score: number, privilege: string): boolean {
  return getPrivileges(score).includes(privilege);
}

export function canPerformAction(score: number, action: string): boolean {
  return hasPrivilege(score, action);
}
