/**
 * Ubuntu Pools — Security Controls Service
 * Manages security controls, evidence, assessments, and incident tracking
 */

import { randomUUID } from 'crypto';
import { db } from '@ubuntu/db/client';
import {
  securityControls,
  controlEvidence,
  controlAssessments,
  securityIncidents,
  controlFrameworks,
  type SecurityControl,
  type NewSecurityControl,
  type ControlEvidence,
  type NewControlEvidence,
  type ControlAssessment,
  type NewControlAssessment,
  type SecurityIncident,
  type NewSecurityIncident,
  type ControlCategory,
  type ControlStatus,
  type ControlPriority,
  type RiskLevel,
} from '@ubuntu/db/schema-security-controls';
import { eq, desc, and, sql, like } from 'drizzle-orm';

export interface ControlSummary {
  total: number;
  implemented: number;
  partial: number;
  missing: number;
  byCategory: Record<ControlCategory, { implemented: number; partial: number; missing: number }>;
  byPriority: Record<ControlPriority, number>;
  maturityScore: number;
}

export interface ControlWithEvidence extends SecurityControl {
  evidence?: ControlEvidence[];
  latestAssessment?: ControlAssessment;
}

export const securityControlsService = {
  async getAllControls(filters?: {
    category?: ControlCategory;
    status?: ControlStatus;
    priority?: ControlPriority;
  }): Promise<SecurityControl[]> {
    const conditions = [];
    
    if (filters?.category) {
      conditions.push(eq(securityControls.category, filters.category));
    }
    if (filters?.status) {
      conditions.push(eq(securityControls.status, filters.status));
    }
    if (filters?.priority) {
      conditions.push(eq(securityControls.priority, filters.priority));
    }
    
    const query = conditions.length > 0
      ? db.select().from(securityControls).where(and(...conditions))
      : db.select().from(securityControls);
    
    return query.orderBy(securityControls.priority, desc(securityControls.controlId));
  },

  async getControlById(id: string): Promise<SecurityControl | undefined> {
    const result = await db.select().from(securityControls).where(eq(securityControls.id, id));
    return result[0];
  },

  async getControlByControlId(controlId: string): Promise<SecurityControl | undefined> {
    const result = await db.select().from(securityControls).where(eq(securityControls.controlId, controlId));
    return result[0];
  },

  async getControlWithDetails(id: string): Promise<ControlWithEvidence | undefined> {
    const control = await this.getControlById(id);
    if (!control) return undefined;
    
    const evidence = await db.select().from(controlEvidence)
      .where(eq(controlEvidence.controlId, id))
      .orderBy(desc(controlEvidence.createdAt));
    
    const assessments = await db.select().from(controlAssessments)
      .where(eq(controlAssessments.controlId, id))
      .orderBy(desc(controlAssessments.assessmentDate))
      .limit(1);
    
    return {
      ...control,
      evidence,
      latestAssessment: assessments[0],
    };
  },

  async createControl(data: Omit<NewSecurityControl, 'id' | 'createdAt' | 'updatedAt'>): Promise<SecurityControl> {
    const id = randomUUID();
    const now = new Date();
    
    const result = await db.insert(securityControls).values({
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    }).returning();
    
    return result[0]!;
  },

  async updateControl(id: string, data: Partial<NewSecurityControl>): Promise<SecurityControl | undefined> {
    const result = await db.update(securityControls)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(securityControls.id, id))
      .returning();
    
    return result[0];
  },

  async updateControlStatus(id: string, status: ControlStatus, assessorId: string, notes?: string): Promise<ControlAssessment | undefined> {
    const control = await this.getControlById(id);
    if (!control) return undefined;
    
    const assessment = await db.insert(controlAssessments).values({
      controlId: id,
      assessorId,
      status,
      previousStatus: control.status,
      notes,
      assessmentDate: new Date(),
      createdAt: new Date(),
    }).returning();
    
    await db.update(securityControls)
      .set({ status, lastReviewDate: new Date(), updatedAt: new Date() })
      .where(eq(securityControls.id, id));
    
    return assessment[0];
  },

  async getControlSummary(): Promise<ControlSummary> {
    const controls = await db.select().from(securityControls);
    
    const summary: ControlSummary = {
      total: 0,
      implemented: 0,
      partial: 0,
      missing: 0,
      byCategory: {
        INFRASTRUCTURE: { implemented: 0, partial: 0, missing: 0 },
        ORGANIZATIONAL: { implemented: 0, partial: 0, missing: 0 },
        PRODUCT: { implemented: 0, partial: 0, missing: 0 },
        INTERNAL_PROCEDURES: { implemented: 0, partial: 0, missing: 0 },
        DATA_PRIVACY: { implemented: 0, partial: 0, missing: 0 },
      },
      byPriority: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      maturityScore: 0,
    };
    
    for (const control of controls) {
      if (control.status === 'not_applicable') continue;
      
      summary.total++;
      
      if (control.status === 'implemented') {
        summary.implemented++;
      } else if (control.status === 'partial') {
        summary.partial++;
      } else if (control.status === 'missing') {
        summary.missing++;
      }
      
      summary.byCategory[control.category] = summary.byCategory[control.category] || { implemented: 0, partial: 0, missing: 0 };
      
      if (control.status === 'implemented') {
        summary.byCategory[control.category].implemented++;
      } else if (control.status === 'partial') {
        summary.byCategory[control.category].partial++;
      } else if (control.status === 'missing') {
        summary.byCategory[control.category].missing++;
      }
      
      summary.byPriority[control.priority]++;
    }
    
    if (summary.total > 0) {
      summary.maturityScore = Math.round((summary.implemented / summary.total) * 100);
    }
    
    return summary;
  },

async addEvidence(controlId: string, data: Omit<NewControlEvidence, 'id' | 'controlId' | 'createdAt'>): Promise<ControlEvidence> {
    const result = await db.insert(controlEvidence).values({
      controlId,
      ...data,
    }).returning();
    
    return result[0]!;
  },

  async verifyEvidence(id: string, verifierId: string): Promise<ControlEvidence | undefined> {
    const result = await db.update(controlEvidence)
      .set({ verifiedBy: verifierId, verifiedAt: new Date() })
      .where(eq(controlEvidence.id, id))
      .returning();
    
    return result[0]!;
  },

  async getEvidenceForControl(controlId: string): Promise<ControlEvidence[]> {
    return db.select().from(controlEvidence)
      .where(eq(controlEvidence.controlId, controlId))
      .orderBy(desc(controlEvidence.createdAt));
  },

  async getControlHistory(controlId: string): Promise<ControlAssessment[]> {
    return db.select().from(controlAssessments)
      .where(eq(controlAssessments.controlId, controlId))
      .orderBy(desc(controlAssessments.assessmentDate));
  },

  async createIncident(data: Omit<NewSecurityIncident, 'id' | 'incidentId' | 'createdAt' | 'updatedAt'>): Promise<SecurityIncident> {
    const id = randomUUID();
    const now = new Date();
    
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(securityIncidents)
      .where(like(securityIncidents.incidentId, `INC-${now.getFullYear()}%`));
    
    const count = (countResult[0]?.count || 0) + 1;
    const incidentId = `INC-${now.getFullYear()}-${count.toString().padStart(5, '0')}`;
    
    const result = await db.insert(securityIncidents).values({
      id,
      incidentId,
      ...data,
      createdAt: now,
      updatedAt: now,
    }).returning();
    
    return result[0]!;
  },

  async updateIncident(id: string, data: Partial<NewSecurityIncident>): Promise<SecurityIncident | undefined> {
    const result = await db.update(securityIncidents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(securityIncidents.id, id))
      .returning();
    
    return result[0]!;
  },

  async getAllIncidents(filters?: {
    severity?: RiskLevel;
    status?: string;
  }): Promise<SecurityIncident[]> {
    const conditions = [];
    
    if (filters?.severity) {
      conditions.push(eq(securityIncidents.severity, filters.severity));
    }
    if (filters?.status) {
      conditions.push(eq(securityIncidents.status, filters.status));
    }
    
    const query = conditions.length > 0
      ? db.select().from(securityIncidents).where(and(...conditions))
      : db.select().from(securityIncidents);
    
    return query.orderBy(desc(securityIncidents.detectedAt));
  },

  async getFrameworks(): Promise<typeof controlFrameworks.$inferSelect[]> {
    return db.select().from(controlFrameworks).where(eq(controlFrameworks.isActive, true));
  },

  async searchControls(query: string): Promise<SecurityControl[]> {
    const searchPattern = `%${query}%`;
    
    return db.select().from(securityControls)
      .where(
        sql`(${securityControls.title} ILIKE ${searchPattern}) OR (${securityControls.description} ILIKE ${searchPattern}) OR (${securityControls.controlId} ILIKE ${searchPattern})`
      )
      .orderBy(securityControls.priority);
  },

  async getControlsByFramework(frameworkName: string): Promise<SecurityControl[]> {
    return db.select().from(securityControls)
      .where(sql`${securityControls.frameworkReferences} @> ${JSON.stringify([frameworkName])}`)
      .orderBy(securityControls.priority);
  },

  async getHighPriorityGaps(): Promise<SecurityControl[]> {
    return db.select().from(securityControls)
      .where(
        and(
          sql`${securityControls.status} IN ('missing', 'partial')`,
          sql`${securityControls.priority} IN ('critical', 'high')`
        )
      )
      .orderBy(securityControls.priority, desc(securityControls.controlId));
  },
};

export type { SecurityControl, ControlEvidence, ControlAssessment, SecurityIncident };
