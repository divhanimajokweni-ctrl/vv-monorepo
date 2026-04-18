// hooks/useMisconceptionHistory.ts
// REFACTORED: replaces binary resolvedAt with confidence 0-1
// WHY: learning is probabilistic, not binary
// FIXED: localStorage wrapped in swappable storage abstraction

import { useState, useEffect, useCallback } from "react";
import { Misconception } from "../types";

export interface MisconceptionRecord {
  misconceptionId: string;
  name: string;
  firstDetectedAt: number;
  lastDetectedAt: number;
  occurrenceCount: number;
  selfCorrectedCount: number;
  confidenceResolved: number;
  resolvedAt?: number;
}

const storage = {
  async get(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async set(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch {
      // private browsing or storage quota exceeded
    }
  },
};

const STORAGE_KEY = "ubdj:misconception_history_v2";

const RECURRENCE_PENALTY = 0.15;
const SELF_CORRECT_BONUS = 0.25;
const RESOLUTION_THRESHOLD = 0.85;
const MIN_OCCURRENCES_TO_RESOLVE = 3;

export function useMisconceptionHistory() {
  const [history, setHistory] = useState<MisconceptionRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    storage.get(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setHistory(JSON.parse(raw));
        } catch {
          // corrupt data
        }
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    storage.set(STORAGE_KEY, JSON.stringify(history));
  }, [history, loaded]);

  const recordMisconception = useCallback((mis: Misconception) => {
    setHistory((prev) => {
      const existing = prev.find((r) => r.misconceptionId === mis.id);

      if (existing) {
        const newConfidence = Math.max(0, existing.confidenceResolved - RECURRENCE_PENALTY);
        return prev.map((r) =>
          r.misconceptionId === mis.id
            ? {
                ...r,
                lastDetectedAt: Date.now(),
                occurrenceCount: r.occurrenceCount + 1,
                confidenceResolved: newConfidence,
                resolvedAt:
                  newConfidence < RESOLUTION_THRESHOLD ? undefined : r.resolvedAt,
              }
            : r
        );
      }

      return [
        ...prev,
        {
          misconceptionId: mis.id,
          name: mis.name,
          firstDetectedAt: Date.now(),
          lastDetectedAt: Date.now(),
          occurrenceCount: 1,
          selfCorrectedCount: 0,
          confidenceResolved: 0,
        },
      ];
    });
  }, []);

  const recordSelfCorrection = useCallback((misconceptionId: string) => {
    setHistory((prev) =>
      prev.map((r) => {
        if (r.misconceptionId !== misconceptionId) return r;
        const newConfidence = Math.min(1, r.confidenceResolved + SELF_CORRECT_BONUS);
        const isNowResolved =
          newConfidence >= RESOLUTION_THRESHOLD &&
          r.occurrenceCount >= MIN_OCCURRENCES_TO_RESOLVE;
        return {
          ...r,
          selfCorrectedCount: r.selfCorrectedCount + 1,
          confidenceResolved: newConfidence,
          resolvedAt: isNowResolved && !r.resolvedAt ? Date.now() : r.resolvedAt,
        };
      })
    );
  }, []);

  const isResolved = useCallback(
    (misconceptionId: string): boolean => {
      const r = history.find((r) => r.misconceptionId === misconceptionId);
      if (!r) return false;
      return (
        r.confidenceResolved >= RESOLUTION_THRESHOLD &&
        r.occurrenceCount >= MIN_OCCURRENCES_TO_RESOLVE
      );
    },
    [history]
  );

  const getUnresolvedByFrequency = useCallback((): MisconceptionRecord[] => {
    return history
      .filter((r) => !isResolved(r.misconceptionId))
      .sort((a, b) => b.occurrenceCount - a.occurrenceCount);
  }, [history, isResolved]);

  const overallSkillScore = useCallback((): number => {
    if (history.length === 0) return 1;
    const avg =
      history.reduce((sum, r) => sum + r.confidenceResolved, 0) / history.length;
    return parseFloat(avg.toFixed(2));
  }, [history]);

  return {
    history,
    loaded,
    recordMisconception,
    recordSelfCorrection,
    isResolved,
    getUnresolvedByFrequency,
    overallSkillScore,
  };
}