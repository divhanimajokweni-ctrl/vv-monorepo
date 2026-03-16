import { z } from "zod";
import { randomUUID } from "crypto";

export const ConsentPurposeSchema = z.enum([
  "core_service",
  "analytics",
  "personalization",
  "third_party",
]);

export type ConsentPurpose = z.infer<typeof ConsentPurposeSchema>;

export const ConsentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  purpose: ConsentPurposeSchema,
  granted: z.boolean(),
  grantedAt: z.string().datetime(),
  revokedAt: z.string().datetime().optional(),
  version: z.string(),
});

export type Consent = z.infer<typeof ConsentSchema>;

class ConsentManager {
  private consentRegistry: Map<string, Consent> = new Map();

  registerConsent(consent: Omit<Consent, "id">): Consent {
    const fullConsent: Consent = {
      ...consent,
      id: randomUUID(),
    };
    this.consentRegistry.set(fullConsent.id, fullConsent);
    return fullConsent;
  }

  grantConsent(userId: string, purpose: ConsentPurpose, version: string = "1.0"): Consent {
    return this.registerConsent({
      userId,
      purpose,
      granted: true,
      grantedAt: new Date().toISOString(),
      version,
    });
  }

  withdrawConsent(userId: string, purpose: ConsentPurpose): boolean {
    for (const consent of this.consentRegistry.values()) {
      if (consent.userId === userId && consent.purpose === purpose) {
        const updated: Consent = {
          ...consent,
          granted: false,
          revokedAt: new Date().toISOString(),
        };
        this.consentRegistry.set(consent.id, updated);
        return true;
      }
    }
    return false;
  }

  hasConsent(userId: string, purpose: ConsentPurpose): boolean {
    for (const consent of this.consentRegistry.values()) {
      if (
        consent.userId === userId &&
        consent.purpose === purpose &&
        consent.granted
      ) {
        return true;
      }
    }
    return false;
  }

  getUserConsents(userId: string): Consent[] {
    return Array.from(this.consentRegistry.values()).filter(
      (c) => c.userId === userId
    );
  }

  isConsentValid(consent: Consent): boolean {
    return consent.granted && !consent.revokedAt;
  }

  getActiveConsents(userId: string, purpose?: ConsentPurpose): Consent[] {
    return this.getUserConsents(userId).filter((c) => {
      if (!this.isConsentValid(c)) return false;
      if (purpose && c.purpose !== purpose) return false;
      return true;
    });
  }
}

export const consentManager = new ConsentManager();

export function canProcessData(userId: string, purpose: string): boolean {
  return consentManager.hasConsent(userId, purpose as ConsentPurpose);
}

export function grantConsent(userId: string, purpose: ConsentPurpose): Consent {
  return consentManager.grantConsent(userId, purpose);
}

export function withdrawConsent(userId: string, purpose: ConsentPurpose): boolean {
  return consentManager.withdrawConsent(userId, purpose);
}
