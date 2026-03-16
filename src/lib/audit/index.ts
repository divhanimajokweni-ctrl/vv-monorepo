/**
 * Ubuntu Pools — Audit Logging
 * 
 * Immutable audit log for critical financial and governance events.
 */

import { z } from "zod";

export const AuditEventTypeSchema = z.enum([
  "proposal_created",
  "vote_cast",
  "credit_issued",
  "credit_repaid",
  "pool_withdrawal",
  "pool_deposit",
  "member_joined",
  "member_left",
  "admin_override",
  "settings_changed",
  "trust_score_updated",
  "village_created",
  "federation_formed",
  "token_minted",
  "token_transferred",
  "settlement_completed",
]);

export type AuditEventType = z.infer<typeof AuditEventTypeSchema>;

export const AuditEventSchema = z.object({
  id: z.string().uuid(),
  eventType: AuditEventTypeSchema,
  timestamp: z.string().datetime(),
  actorId: z.string().uuid(),
  actorType: z.enum(["user", "village", "federation", "system"]),
  targetId: z.string().uuid(),
  targetType: z.enum(["user", "village", "proposal", "credit", "pool", "federation", "token"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  hash: z.string(),
  previousHash: z.string(),
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;

export interface AuditLogEntry extends AuditEvent {
  blockHeight?: number;
  confirmed: boolean;
}

export function createAuditHash(event: Omit<AuditEvent, "hash" | "previousHash">): string {
  const data = JSON.stringify({
    eventType: event.eventType,
    timestamp: event.timestamp,
    actorId: event.actorId,
    targetId: event.targetId,
    metadata: event.metadata,
  });
  
  return hashString(data);
}

function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, "0");
}

export function createAuditEvent(
  eventType: AuditEventType,
  actorId: string,
  actorType: "user" | "village" | "federation" | "system",
  targetId: string,
  targetType: "user" | "village" | "proposal" | "credit" | "pool" | "federation" | "token",
  metadata?: Record<string, unknown>,
  previousHash?: string
): AuditEvent {
  const timestamp = new Date().toISOString();
  const eventData: Omit<AuditEvent, "hash" | "previousHash"> = {
    id: crypto.randomUUID(),
    eventType,
    timestamp,
    actorId,
    actorType,
    targetId,
    targetType,
    metadata,
  };

  const hash = createAuditHash(eventData);

  return {
    ...eventData,
    hash,
    previousHash: previousHash || "0000000000000000",
  };
}

export const AUDIT_EVENT_LABELS: Record<AuditEventType, string> = {
  proposal_created: "Proposal Created",
  vote_cast: "Vote Cast",
  credit_issued: "Credit Issued",
  credit_repaid: "Credit Repaid",
  pool_withdrawal: "Pool Withdrawal",
  pool_deposit: "Pool Deposit",
  member_joined: "Member Joined",
  member_left: "Member Left",
  admin_override: "Admin Override",
  settings_changed: "Settings Changed",
  trust_score_updated: "Trust Score Updated",
  village_created: "Village Created",
  federation_formed: "Federation Formed",
  token_minted: "Token Minted",
  token_transferred: "Token Transferred",
  settlement_completed: "Settlement Completed",
};

export const AUDIT_EVENT_SEVERITY: Record<AuditEventType, "low" | "medium" | "high" | "critical"> = {
  proposal_created: "low",
  vote_cast: "low",
  credit_issued: "high",
  credit_repaid: "high",
  pool_withdrawal: "critical",
  pool_deposit: "medium",
  member_joined: "low",
  member_left: "medium",
  admin_override: "critical",
  settings_changed: "medium",
  trust_score_updated: "low",
  village_created: "medium",
  federation_formed: "high",
  token_minted: "critical",
  token_transferred: "high",
  settlement_completed: "high",
};

export function getAuditEventSeverity(eventType: AuditEventType): "low" | "medium" | "high" | "critical" {
  return AUDIT_EVENT_SEVERITY[eventType];
}

export function formatAuditEvent(event: AuditEvent): string {
  const label = AUDIT_EVENT_LABELS[event.eventType];
  const severity = AUDIT_EVENT_SEVERITY[event.eventType];
  
  return `[${severity.toUpperCase()}] ${label}
Actor: ${event.actorType}:${event.actorId}
Target: ${event.targetType}:${event.targetId}
Time: ${event.timestamp}
Hash: ${event.hash}`;
}
