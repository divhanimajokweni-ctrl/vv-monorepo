// src/lib/ubuntudj/index.ts
// ============================================================================
// UbuntuDJ - Professional DJ Misconception Detection System
// ============================================================================

// Types
export type { 
  Misconception, 
  DetectionRule, 
  CorrectiveAction, 
  DetectionContext 
} from "./types";
export { MISCONCEPTIONS, isCamelotCompatible } from "./types";

// Store
export { useDJStore } from "./store/djStore";

// Detector
export type { 
  UserActionEvent, 
  DeckState 
} from "./detector/misconceptionDetector";
export { 
  detectMisconception,
  RuleConditions,
  createEmptyContext,
  isMisconceptionOnCooldown,
} from "./detector/misconceptionDetector";

// Hooks
export { useMisconceptionHistory } from "./hooks/useMisconceptionHistory";
export type { MisconceptionRecord } from "./hooks/useMisconceptionHistory"

export { useSessionIntent } from "./hooks/useSessionIntent";

// Integration  
export { useUbuntuDJIntegration } from "./integration/UbuntuDJIntegration";

// Chat System
export { buildSystem } from "./chat/chatSystem";