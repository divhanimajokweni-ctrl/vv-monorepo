/**
 * Ubuntu Pools — Credit Facilities Event Schemas
 * Phase 6: Credit System Events
 * 
 * Event Types:
 *   - credit.pool_initialized    — Credit pool configuration created
 *   - credit.capital_deposited  — Capital/buffer added to pool
 *   - credit.phase_transition   — Pool phase changed
 *   - credit.eligibility_checked — Member credit eligibility evaluated
 *   - credit.loan_requested     — Member requests credit
 *   - credit.loan_approved      — Credit approved
 *   - credit.loan_rejected     — Credit rejected
 *   - credit.loan_issued       — Credit disbursed
 *   - credit.payment_received   — Payment received
 *   - credit.loan_repaid        — Loan fully repaid
 *   - credit.loan_defaulted    — Loan defaulted
 *   - credit.health_updated     — Pool health recalculated
 */

import { z } from "zod";
import { 
  uuidSchema, 
  currencySchema, 
  minorUnitAmountSchema, 
  baseEventSchema, 
  eventTypeSchema 
} from "./schemas";

export const creditPoolInitializedPayloadSchema = z.object({
  poolId: uuidSchema,
  currency: currencySchema.default("USD"),
  phase1BufferTarget: minorUnitAmountSchema,
  phase2Alpha: z.number().int().min(1).max(20).default(5),
  phase2MaxDurationDays: z.number().int().min(7).max(180).default(90),
  beta: z.number().int().min(1).max(50).default(25),
  gamma: z.number().int().min(1).max(50).default(10),
  healthGateLow: z.number().int().min(0).max(100).default(70),
  healthGateMedium: z.number().int().min(0).max(100).default(85),
  healthGateHigh: z.number().int().min(0).max(100).default(90),
  minContributionWindowDays: z.number().int().min(0).max(365).default(90),
});

export type CreditPoolInitializedPayload = z.infer<typeof creditPoolInitializedPayloadSchema>;

export const creditCapitalDepositedPayloadSchema = z.object({
  poolId: uuidSchema,
  capitalAmount: minorUnitAmountSchema,
  bufferAmount: minorUnitAmountSchema,
  totalPoolCapital: minorUnitAmountSchema,
  safetyBuffer: minorUnitAmountSchema,
  currency: currencySchema,
  depositedBy: uuidSchema,
});

export type CreditCapitalDepositedPayload = z.infer<typeof creditCapitalDepositedPayloadSchema>;

export const creditPhaseTransitionPayloadSchema = z.object({
  poolId: uuidSchema,
  previousPhase: z.enum(["phase1_formation", "phase2_microcredit", "phase3_scaling"]),
  newPhase: z.enum(["phase1_formation", "phase2_microcredit", "phase3_scaling"]),
  triggerReason: z.string().min(1),
  poolHealthScore: z.number().int().min(0).max(100),
  bufferRatio: z.number().int().min(0),
});

export type CreditPhaseTransitionPayload = z.infer<typeof creditPhaseTransitionPayloadSchema>;

export const creditEligibilityCheckedPayloadSchema = z.object({
  poolId: uuidSchema,
  memberId: uuidSchema,
  ubuntuScore: z.number().int().min(0).max(100),
  contributionBase: minorUnitAmountSchema,
  contributionWindowDays: z.number().int().min(0),
  poolPhase: z.enum(["phase1_formation", "phase2_microcredit", "phase3_scaling"]),
  poolHealthScore: z.number().int().min(0).max(100),
  creditActivated: z.boolean(),
  existingExposure: minorUnitAmountSchema,
  eligible: z.boolean(),
  creditLimit: minorUnitAmountSchema,
  reason: z.string().optional(),
});

export type CreditEligibilityCheckedPayload = z.infer<typeof creditEligibilityCheckedPayloadSchema>;

export const creditLoanRequestedPayloadSchema = z.object({
  poolId: uuidSchema,
  memberId: uuidSchema,
  requestedAmount: minorUnitAmountSchema,
  termDays: z.number().int().positive(),
  creditType: z.enum(["microcredit", "standard", "extended"]),
  purpose: z.string().optional(),
  ubuntuScoreAtRequest: z.number().int().min(0).max(100),
});

export type CreditLoanRequestedPayload = z.infer<typeof creditLoanRequestedPayloadSchema>;

export const creditLoanApprovedPayloadSchema = z.object({
  poolId: uuidSchema,
  memberId: uuidSchema,
  loanId: z.string().min(1),
  principal: minorUnitAmountSchema,
  interestRate: z.number().int().min(0),
  interestAmount: minorUnitAmountSchema,
  totalDue: minorUnitAmountSchema,
  termDays: z.number().int().positive(),
  dueDate: z.string().datetime(),
  creditType: z.enum(["microcredit", "standard", "extended"]),
  poolHealthAtApproval: z.number().int().min(0).max(100),
  phaseAtApproval: z.enum(["phase1_formation", "phase2_microcredit", "phase3_scaling"]),
});

export type CreditLoanApprovedPayload = z.infer<typeof creditLoanApprovedPayloadSchema>;

export const creditLoanRejectedPayloadSchema = z.object({
  poolId: uuidSchema,
  memberId: uuidSchema,
  requestedAmount: minorUnitAmountSchema,
  rejectionReason: z.string().min(1),
  creditType: z.enum(["microcredit", "standard", "extended"]),
});

export type CreditLoanRejectedPayload = z.infer<typeof creditLoanRejectedPayloadSchema>;

export const creditLoanIssuedPayloadSchema = z.object({
  poolId: uuidSchema,
  memberId: uuidSchema,
  loanId: z.string().min(1),
  principal: minorUnitAmountSchema,
  totalDue: minorUnitAmountSchema,
  issuedAt: z.string().datetime(),
  dueDate: z.string().datetime(),
  poolActiveExposure: minorUnitAmountSchema,
});

export type CreditLoanIssuedPayload = z.infer<typeof creditLoanIssuedPayloadSchema>;

export const creditPaymentReceivedPayloadSchema = z.object({
  poolId: uuidSchema,
  memberId: uuidSchema,
  loanId: z.string().min(1),
  amount: minorUnitAmountSchema,
  paymentType: z.enum(["principal", "interest", "full"]),
  remainingBalance: minorUnitAmountSchema,
  isOnTime: z.boolean(),
  paidAt: z.string().datetime(),
});

export type CreditPaymentReceivedPayload = z.infer<typeof creditPaymentReceivedPayloadSchema>;

export const creditLoanRepaidPayloadSchema = z.object({
  poolId: uuidSchema,
  memberId: uuidSchema,
  loanId: z.string().min(1),
  principal: minorUnitAmountSchema,
  totalPaid: minorUnitAmountSchema,
  repaidAt: z.string().datetime(),
  poolActiveExposure: minorUnitAmountSchema,
  onTimeRepayment: z.boolean(),
});

export type CreditLoanRepaidPayload = z.infer<typeof creditLoanRepaidPayloadSchema>;

export const creditLoanDefaultedPayloadSchema = z.object({
  poolId: uuidSchema,
  memberId: uuidSchema,
  loanId: z.string().min(1),
  principal: minorUnitAmountSchema,
  amountDue: minorUnitAmountSchema,
  amountPaid: minorUnitAmountSchema,
  daysOverdue: z.number().int().min(0),
  defaultedAt: z.string().datetime(),
});

export type CreditLoanDefaultedPayload = z.infer<typeof creditLoanDefaultedPayloadSchema>;

export const creditHealthUpdatedPayloadSchema = z.object({
  poolId: uuidSchema,
  poolHealthScore: z.number().int().min(0).max(100),
  bufferRatio: z.number().int().min(0),
  capitalRatio: z.number().int().min(0),
  defaultRate: z.number().int().min(0),
  liquidityScore: z.number().int().min(0).max(100),
  assetQualityScore: z.number().int().min(0).max(100),
  profitabilityScore: z.number().int().min(0).max(100),
  growthScore: z.number().int().min(0).max(100),
  activeCreditExposure: minorUnitAmountSchema,
  safetyBuffer: minorUnitAmountSchema,
  recordedAt: z.string().datetime(),
});

export type CreditHealthUpdatedPayload = z.infer<typeof creditHealthUpdatedPayloadSchema>;

export const creditPoolInitializedEventSchema = baseEventSchema.extend({
  eventType: z.literal("credit.pool_initialized"),
  entityType: z.literal("credit_pool"),
  payload: creditPoolInitializedPayloadSchema,
});

export const creditCapitalDepositedEventSchema = baseEventSchema.extend({
  eventType: z.literal("credit.capital_deposited"),
  entityType: z.literal("credit_pool"),
  payload: creditCapitalDepositedPayloadSchema,
});

export const creditPhaseTransitionEventSchema = baseEventSchema.extend({
  eventType: z.literal("credit.phase_transition"),
  entityType: z.literal("credit_pool"),
  payload: creditPhaseTransitionPayloadSchema,
});

export const creditEligibilityCheckedEventSchema = baseEventSchema.extend({
  eventType: z.literal("credit.eligibility_checked"),
  entityType: z.literal("member_credit"),
  payload: creditEligibilityCheckedPayloadSchema,
});

export const creditLoanRequestedEventSchema = baseEventSchema.extend({
  eventType: z.literal("credit.loan_requested"),
  entityType: z.literal("credit_loan"),
  payload: creditLoanRequestedPayloadSchema,
});

export const creditLoanApprovedEventSchema = baseEventSchema.extend({
  eventType: z.literal("credit.loan_approved"),
  entityType: z.literal("credit_loan"),
  payload: creditLoanApprovedPayloadSchema,
});

export const creditLoanRejectedEventSchema = baseEventSchema.extend({
  eventType: z.literal("credit.loan_rejected"),
  entityType: z.literal("credit_loan"),
  payload: creditLoanRejectedPayloadSchema,
});

export const creditLoanIssuedEventSchema = baseEventSchema.extend({
  eventType: z.literal("credit.loan_issued"),
  entityType: z.literal("credit_loan"),
  payload: creditLoanIssuedPayloadSchema,
});

export const creditPaymentReceivedEventSchema = baseEventSchema.extend({
  eventType: z.literal("credit.payment_received"),
  entityType: z.literal("credit_payment"),
  payload: creditPaymentReceivedPayloadSchema,
});

export const creditLoanRepaidEventSchema = baseEventSchema.extend({
  eventType: z.literal("credit.loan_repaid"),
  entityType: z.literal("credit_loan"),
  payload: creditLoanRepaidPayloadSchema,
});

export const creditLoanDefaultedEventSchema = baseEventSchema.extend({
  eventType: z.literal("credit.loan_defaulted"),
  entityType: z.literal("credit_loan"),
  payload: creditLoanDefaultedPayloadSchema,
});

export const creditHealthUpdatedEventSchema = baseEventSchema.extend({
  eventType: z.literal("credit.health_updated"),
  entityType: z.literal("credit_pool"),
  payload: creditHealthUpdatedPayloadSchema,
});

export const phase6EventSchema = z.discriminatedUnion("eventType", [
  creditPoolInitializedEventSchema,
  creditCapitalDepositedEventSchema,
  creditPhaseTransitionEventSchema,
  creditEligibilityCheckedEventSchema,
  creditLoanRequestedEventSchema,
  creditLoanApprovedEventSchema,
  creditLoanRejectedEventSchema,
  creditLoanIssuedEventSchema,
  creditPaymentReceivedEventSchema,
  creditLoanRepaidEventSchema,
  creditLoanDefaultedEventSchema,
  creditHealthUpdatedEventSchema,
]);

export type Phase6Event = z.infer<typeof phase6EventSchema>;

export const creditEventSchemaMap: Record<string, z.ZodSchema> = {
  "credit.pool_initialized": creditPoolInitializedPayloadSchema,
  "credit.capital_deposited": creditCapitalDepositedPayloadSchema,
  "credit.phase_transition": creditPhaseTransitionPayloadSchema,
  "credit.eligibility_checked": creditEligibilityCheckedPayloadSchema,
  "credit.loan_requested": creditLoanRequestedPayloadSchema,
  "credit.loan_approved": creditLoanApprovedPayloadSchema,
  "credit.loan_rejected": creditLoanRejectedPayloadSchema,
  "credit.loan_issued": creditLoanIssuedPayloadSchema,
  "credit.payment_received": creditPaymentReceivedPayloadSchema,
  "credit.loan_repaid": creditLoanRepaidPayloadSchema,
  "credit.loan_defaulted": creditLoanDefaultedPayloadSchema,
  "credit.health_updated": creditHealthUpdatedPayloadSchema,
};
