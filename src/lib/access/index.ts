export * from "./rbac";
export * from "./guards";
export * from "./consent-manager";

import {
  isSelfAccess,
  checkPrivilege,
  checkConsent,
  checkOwnership,
  requireSelfAccess,
  requirePrivilege,
  requireConsent,
  type AccessCheckResult,
} from "./guards";
import {
  getAuthorityLevel,
  getPrivileges,
  hasPrivilege,
  canPerformAction,
  type AuthorityLevel,
} from "./rbac";
import {
  consentManager,
  canProcessData,
  grantConsent,
  withdrawConsent,
  type Consent,
  type ConsentPurpose,
} from "./consent-manager";

export const accessControl = {
  check: (score: number, privilege: string): AccessCheckResult => {
    return checkPrivilege(score, privilege);
  },
  checkConsent: (userId: string, purpose: string): AccessCheckResult => {
    return checkConsent(userId, purpose);
  },
  isSelfAccess: (userId: string, targetId: string): AccessCheckResult => {
    return isSelfAccess(userId, targetId);
  },
  requireSelfAccess: (userId: string, targetId: string): void => {
    requireSelfAccess(userId, targetId);
  },
  requirePrivilege: (score: number, privilege: string): void => {
    requirePrivilege(score, privilege);
  },
  requireConsent: (userId: string, purpose: string): void => {
    requireConsent(userId, purpose);
  },
  getAuthorityLevel,
  getPrivileges,
  hasPrivilege,
  canPerformAction,
  consentManager,
  canProcessData,
  grantConsent,
  withdrawConsent,
};
