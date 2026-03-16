import { hasPrivilege } from "./rbac";
import { canProcessData } from "./consent-manager";

export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
}

export function isSelfAccess(userId: string, targetId: string): AccessCheckResult {
  if (userId === targetId) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: "Cannot access other user's resources",
  };
}

export function checkPrivilege(userScore: number, privilege: string): AccessCheckResult {
  if (hasPrivilege(userScore, privilege)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: `Missing required privilege: ${privilege}`,
  };
}

export function checkConsent(userId: string, purpose: string): AccessCheckResult {
  if (canProcessData(userId, purpose)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: `Consent not granted for purpose: ${purpose}`,
  };
}

export function checkOwnership(userId: string, ownerId: string): AccessCheckResult {
  return isSelfAccess(userId, ownerId);
}

export function requireSelfAccess(userId: string, targetId: string): void {
  const result = isSelfAccess(userId, targetId);
  if (!result.allowed) {
    const error = new Error(result.reason) as Error & { statusCode: number };
    error.statusCode = 403;
    throw error;
  }
}

export function requirePrivilege(userScore: number, privilege: string): void {
  const result = checkPrivilege(userScore, privilege);
  if (!result.allowed) {
    const error = new Error(result.reason) as Error & { statusCode: number };
    error.statusCode = 403;
    throw error;
  }
}

export function requireConsent(userId: string, purpose: string): void {
  const result = checkConsent(userId, purpose);
  if (!result.allowed) {
    const error = new Error(result.reason) as Error & { statusCode: number };
    error.statusCode = 403;
    throw error;
  }
}
