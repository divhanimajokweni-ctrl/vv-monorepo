import { z } from 'zod';

export const createEventInputSchema = z.object({
  type: z.string().min(1),
  payload: z.record(z.unknown()),
  memberId: z.string().optional(),
  villageId: z.string().optional(),
});

export type CreateEventInput = z.infer<typeof createEventInputSchema>;

export const auditIncidentCreatedPayloadSchema = z.object({
  incidentId: z.string(),
  type: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string(),
  reportedAt: z.string().datetime(),
});

export type AuditIncidentCreatedPayload = z.infer<typeof auditIncidentCreatedPayloadSchema>;

export const contributionCreatedPayloadSchema = z.object({
  memberId: z.string(),
  villageId: z.string(),
  poolId: z.string(),
  amount: z.number(),
  currency: z.string(),
  timestamp: z.number(),
});

export const proposalCreatedPayloadSchema = z.object({
  proposalId: z.string(),
  title: z.string(),
  description: z.string(),
  proposerId: z.string(),
  villageId: z.string(),
  votingPeriodEnd: z.string().datetime(),
});

export const voteCastPayloadSchema = z.object({
  proposalId: z.string(),
  voterId: z.string(),
  choice: z.enum(['yes', 'no', 'abstain']),
  weight: z.number().positive(),
});