/**
 * Ubuntu Pools — Security Controls Schema
 * 
 * Control register for tracking security, governance, and compliance controls
 * across the Ubuntu Pools platform.
 * 
 * Categories:
 * - Infrastructure (INF): Network, keys, backups, runtime
 * - Organizational (ORG): Access, training, incidents, vendors
 * - Product (PROD): Auth, authz, validation, anti-abuse
 * - Internal Procedures (PROC): SDLC, testing, logging
 * - Data & Privacy (DATA): Rights, consent, POPIA compliance
 */

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  jsonb,
  timestamp,
  integer,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

// =============================================================================
// ENUMS
// =============================================================================

export const controlCategoryEnum = pgEnum("control_category", [
  "INFRASTRUCTURE",
  "ORGANIZATIONAL",
  "PRODUCT",
  "INTERNAL_PROCEDURES",
  "DATA_PRIVACY",
]);

export const controlStatusEnum = pgEnum("control_status", [
  "implemented",
  "partial",
  "missing",
  "not_applicable",
]);

export const controlPriorityEnum = pgEnum("control_priority", [
  "critical",
  "high",
  "medium",
  "low",
]);

export const evidenceTypeEnum = pgEnum("evidence_type", [
  "document",
  "screenshot",
  "log",
  "configuration",
  "test_report",
  "audit_report",
  "policy",
  "procedure",
]);

export const riskLevelEnum = pgEnum("risk_level", [
  "critical",
  "high",
  "medium",
  "low",
]);

// =============================================================================
// TABLE: security_controls
// =============================================================================

export const securityControls = pgTable(
  "security_controls",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    controlId: text("control_id").notNull(),

    category: controlCategoryEnum("category").notNull(),

    title: text("title").notNull(),

    description: text("description").notNull(),

    systemComponent: text("system_component").notNull(),

    status: controlStatusEnum("status").notNull().default("missing"),

    priority: controlPriorityEnum("priority").notNull().default("medium"),

    owner: text("owner"),

    riskLevel: riskLevelEnum("risk_level"),

    gapDescription: text("gap_description"),

    recommendation: text("recommendation"),

    relatedControls: jsonb("related_controls").notNull().default([]),

    frameworkReferences: jsonb("framework_references").notNull().default([]),

    effectiveDate: timestamptz("effective_date"),

    lastReviewDate: timestamptz("last_review_date"),

    nextReviewDate: timestamptz("next_review_date"),

    createdAt: timestamptz("created_at").notNull().defaultNow(),

    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    controlIdUnique: uniqueIndex("security_controls_control_id_unique").on(table.controlId),
    categoryIdx: index("idx_security_controls_category").on(table.category),
    statusIdx: index("idx_security_controls_status").on(table.status),
    priorityIdx: index("idx_security_controls_priority").on(table.priority),
  })
);

// =============================================================================
// TABLE: control_evidence
// =============================================================================

export const controlEvidence = pgTable(
  "control_evidence",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    controlId: uuid("control_id")
      .notNull()
      .references(() => securityControls.id, { onDelete: "cascade" }),

    evidenceType: evidenceTypeEnum("evidence_type").notNull(),

    title: text("title").notNull(),

    description: text("description"),

    evidenceUrl: text("evidence_url"),

    evidenceHash: text("evidence_hash"),

    submittedBy: uuid("submitted_by"),

    verifiedBy: uuid("verified_by"),

    verifiedAt: timestamptz("verified_at"),

    expirationDate: timestamptz("expiration_date"),

    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => ({
    controlIdx: index("idx_control_evidence_control").on(table.controlId),
    submitterIdx: index("idx_control_evidence_submitter").on(table.submittedBy),
    verifierIdx: index("idx_control_evidence_verifier").on(table.verifiedBy),
  })
);

// =============================================================================
// TABLE: control_assessments
// =============================================================================

export const controlAssessments = pgTable(
  "control_assessments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    controlId: uuid("control_id")
      .notNull()
      .references(() => securityControls.id, { onDelete: "cascade" }),

    assessorId: uuid("assessor_id").notNull(),

    assessmentDate: timestamptz("assessment_date").notNull().defaultNow(),

    status: controlStatusEnum("status").notNull(),

    previousStatus: controlStatusEnum("previous_status"),

    notes: text("notes"),

    findings: jsonb("findings").notNull().default([]),

    remediationPlan: text("remediation_plan"),

    remediationDueDate: timestamptz("remediation_due_date"),

    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => ({
    controlIdx: index("idx_control_assessments_control").on(table.controlId),
    assessorIdx: index("idx_control_assessments_assessor").on(table.assessorId),
    dateIdx: index("idx_control_assessments_date").on(table.assessmentDate),
  })
);

// =============================================================================
// TABLE: security_incidents
// =============================================================================

export const securityIncidents = pgTable(
  "security_incidents",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    incidentId: text("incident_id").notNull(),

    title: text("title").notNull(),

    description: text("description").notNull(),

    severity: riskLevelEnum("severity").notNull(),

    status: text("status").notNull().default("open"),

    affectedControls: jsonb("affected_controls").notNull().default([]),

    affectedSystems: jsonb("affected_systems").notNull().default([]),

    detectedAt: timestamptz("detected_at").notNull().defaultNow(),

    resolvedAt: timestamptz("resolved_at"),

    reportedBy: uuid("reported_by"),

    assignedTo: uuid("assigned_to"),

    resolutionNotes: text("resolution_notes"),

    createdAt: timestamptz("created_at").notNull().defaultNow(),

    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    incidentIdUnique: uniqueIndex("security_incidents_incident_id_unique").on(table.incidentId),
    severityIdx: index("idx_security_incidents_severity").on(table.severity),
    statusIdx: index("idx_security_incidents_status").on(table.status),
    detectedIdx: index("idx_security_incidents_detected").on(table.detectedAt),
  })
);

// =============================================================================
// TABLE: control_frameworks
// =============================================================================

export const controlFrameworks = pgTable(
  "control_frameworks",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: text("name").notNull(),

    version: text("version").notNull(),

    description: text("description"),

    referenceUrl: text("reference_url"),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => ({
    nameUnique: uniqueIndex("control_frameworks_name_unique").on(table.name, table.version),
  })
);

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type SecurityControl = typeof securityControls.$inferSelect;
export type NewSecurityControl = typeof securityControls.$inferInsert;

export type ControlEvidence = typeof controlEvidence.$inferSelect;
export type NewControlEvidence = typeof controlEvidence.$inferInsert;

export type ControlAssessment = typeof controlAssessments.$inferSelect;
export type NewControlAssessment = typeof controlAssessments.$inferInsert;

export type SecurityIncident = typeof securityIncidents.$inferSelect;
export type NewSecurityIncident = typeof securityIncidents.$inferInsert;

export type ControlFramework = typeof controlFrameworks.$inferSelect;
export type NewControlFramework = typeof controlFrameworks.$inferInsert;

export type ControlCategory = (typeof controlCategoryEnum.enumValues)[number];
export type ControlStatus = (typeof controlStatusEnum.enumValues)[number];
export type ControlPriority = (typeof controlPriorityEnum.enumValues)[number];
export type EvidenceType = (typeof evidenceTypeEnum.enumValues)[number];
export type RiskLevel = (typeof riskLevelEnum.enumValues)[number];
