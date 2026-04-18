// src/lib/ubuntudj/detector/misconceptionDetector.ts
// ============================================================================
// FULL PRODUCTION CODE: misconceptionDetector.ts (Zustand Store Version)
// ============================================================================
// Complete replacement for the previous module-level singleton version.
// Now reads all context from the Zustand store and is fully compatible with React Strict Mode.

import { MISCONCEPTIONS, Misconception, DetectionContext } from "../types";
import { SessionIntent } from "../hooks/useSessionIntent";

// ============================================================================
// TYPES
// ============================================================================

export interface UserActionEvent {
  type: string;
  deck?: "A" | "B";
  value?: any;
  previousValue?: any;
  durationMs?: number;
  timestamp: number;
  loopLength?: number;
  effect?: string;
  track?: any;
  startPosition?: number;
  knob?: "low" | "mid" | "high";
  [key: string]: any;
}

export interface DeckState {
  track: any;
  playing: boolean;
  pitch: number;
  bpm: number;
  volume: number;
  eqHigh: number;
  eqMid: number;
  eqLow: number;
  progress: number;
  cued: boolean;
  [key: string]: any;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

function getCamelotStep(currentKey: string, targetKey: string): number {
  const camelotMap: Record<string, number> = {
    "Am": 1, "Bm": 2, "Cm": 3, "Dm": 4, "Em": 5, "Fm": 6, "Gm": 7,
    "A": 8, "B": 9, "C": 10, "D": 11, "E": 12, "F": 1, "G": 2,
  };
  const current = camelotMap[currentKey] || 0;
  const target = camelotMap[targetKey] || 0;
  if (current === 0 || target === 0) return 999;
  const diff = Math.abs(current - target);
  return Math.min(diff, 12 - diff);
}

// ============================================================================
// CORE DETECTION FUNCTION
// ============================================================================

/**
 * Detect if a user action reveals a known misconception.
 * Pure function – all context passed in explicitly.
 */
export function detectMisconception(
  event: UserActionEvent,
  deckA: DeckState,
  deckB: DeckState,
  context: DetectionContext,
  sessionIntent: SessionIntent,
  isOnCooldown: (misId: string) => boolean
): Misconception | null {
  // Don't interrupt during "record" mode unless critical error
  if (sessionIntent === "record") {
    const isCritical = event.type === "crossfader_moved" && 
                       event.durationMs && 
                       event.durationMs < 200 && 
                       Math.abs((event.previousValue || 0) - (event.value || 0)) > 0.9;
    if (!isCritical) return null;
  }
  
  // In "explore" mode, detect but don't trigger dialogue (return null)
  if (sessionIntent === "explore") {
    const mis = evaluateAllRules(event, deckA, deckB, context);
    if (mis) {
      return null;
    }
    return null;
  }

  return evaluateAllRules(event, deckA, deckB, context);
}

// ============================================================================
// RULE EVALUATION ENGINE
// ============================================================================

function evaluateAllRules(
  event: UserActionEvent,
  deckA: DeckState,
  deckB: DeckState,
  context: DetectionContext
): Misconception | null {
  for (const mis of MISCONCEPTIONS) {
    for (const rule of mis.detectionRules) {
      if (rule.eventType !== event.type && rule.eventType !== "any" && rule.eventType !== "session_end") {
        continue;
      }
      
      if (rule.deck && rule.deck !== "any" && rule.deck !== event.deck) {
        continue;
      }
      
      try {
        const conditionMet = rule.condition(event, deckA, deckB, context);
        if (conditionMet) {
          return mis;
        }
      } catch (err) {
        console.error(`Error evaluating rule for ${mis.id}:`, err);
      }
    }
  }
  return null;
}

// ============================================================================
// EXPORTED RULE FUNCTIONS (for testing / standalone use)
// ============================================================================

export const RuleConditions = {
  // M001: Beatmatching = same BPM only
  beatmatchSameBPMOnly: (event: any, deckA: DeckState, deckB: DeckState, context: DetectionContext): boolean => {
    if (event.type !== "tempo_slider_moved") return false;
    const bpmA = deckA.track?.bpm * (1 + (deckA.pitch || 0) / 2000);
    const bpmB = deckB.track?.bpm * (1 + (event.value || 0) / 2000);
    const diff = Math.abs(bpmA - bpmB);
    const usedPitchBendRecently = context.recentActions.some(
      (a: any) => a.type === "pitch_bend" && a.timestamp > Date.now() - 30000
    );
    return diff < 0.5 && !usedPitchBendRecently;
  },

  // M002: Louder = better transition
  abruptCrossfader: (event: any): boolean => {
    if (event.type !== "crossfader_moved") return false;
    return (event.durationMs || 0) < 500 && Math.abs((event.previousValue || 0) - (event.value || 0)) > 0.8;
  },

  // M003: Invalid loop length
  invalidLoopLength: (event: any): boolean => {
    if (event.type !== "loop_set") return false;
    return !isPowerOfTwo(event.loopLength);
  },

  // M004: Only uses low EQ
  onlyUsesLowEQ: (event: any, _: any, __: any, context: DetectionContext): boolean => {
    if (event.type !== "eq_changed") return false;
    const timeSinceMidHigh = Date.now() - context.lastMidOrHighChange;
    return event.knob === "low" && (event.value || 0) > 10 && timeSinceMidHigh > 60000;
  },

  // M005: Heavy reverb
  heavyReverb: (event: any): boolean => {
    if (event.type !== "effect_changed") return false;
    return event.effect === "reverb" && (event.value || 0) > 70;
  },

  // M006: Avoids harmonic mixing
  avoidsHarmonicMixing: (event: any, deckA: DeckState): boolean => {
    if (event.type !== "track_load_rejected") return false;
    const currentKey = deckA.track?.key || "Am";
    const candidateKey = event.track?.key || "C";
    const step = getCamelotStep(currentKey, candidateKey);
    return step > 2 && step < 10;
  },

  // M007: Never uses crossfader
  neverUsesCrossfader: (event: any, _: any, __: any, context: DetectionContext): boolean => {
    if (event.type !== "session_end") return false;
    return context.crossfaderMovements === 0;
  },

  // M008: Starts track off-phrase
  offPhraseStart: (event: any): boolean => {
    if (event.type !== "track_start") return false;
    const beatPosition = (event.startPosition || 0) % 32;
    return beatPosition !== 0;
  },

  // M009: Monotonic energy increase
  monotonicEnergy: (event: any, _: any, __: any, context: DetectionContext): boolean => {
    if (event.type !== "track_load") return false;
    const previousTracks = context.previousTracks;
    if (previousTracks.length < 5) return false;
    const lastFive = previousTracks.slice(-5).map((t: any) => t.energy);
    return lastFive.every((e, i) => i === 0 || e >= lastFive[i - 1]);
  },

  // M010: Never sets cue points
  neverSetsCuePoints: (event: any, _: any, __: any, context: DetectionContext): boolean => {
    if (event.type !== "session_end") return false;
    return context.cuePointsSet === 0;
  },
};

// ============================================================================
// SESSION UTILITIES
// ============================================================================

/**
 * Create an empty detection context (for testing or manual reset)
 */
export function createEmptyContext(): DetectionContext {
  return {
    recentActions: [],
    crossfaderMovements: 0,
    previousTracks: [],
    cuePointsSet: 0,
    lastMidOrHighChange: Date.now(),
  };
}

/**
 * Check if a user has recently been alerted about a misconception
 */
export function isMisconceptionOnCooldown(
  misconceptionId: string,
  recentAlertIds: { id: string; at: number }[],
  cooldownMs: number = 60000
): boolean {
  return recentAlertIds.some(
    (alert) => alert.id === misconceptionId && Date.now() - alert.at < cooldownMs
  );
}

// ============================================================================
// EXPORTS SUMMARY
// ============================================================================

export type { Misconception, DetectionContext };