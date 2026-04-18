// hooks/useSessionIntent.ts
// UPDATED: session intent inferred from behaviour, not only from UI toggle.
// If user declares "practice" but runs 4 minutes clean, auto-infers "record".

import { useState, useCallback, useEffect, useRef } from "react";

export type SessionIntent = "learn" | "practice" | "record" | "explore";

interface UseSessionIntentOptions {
  autoRecordAfterMs?: number;
}

export function useSessionIntent(
  initialIntent: SessionIntent = "practice",
  options: UseSessionIntentOptions = {}
) {
  const { autoRecordAfterMs = 240_000 } = options;

  const [declaredIntent, setDeclaredIntent] = useState<SessionIntent>(initialIntent);
  const [inferredIntent, setInferredIntent] = useState<SessionIntent | null>(null);

  const cleanRunTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setSessionIntent = useCallback((newIntent: SessionIntent) => {
    setDeclaredIntent(newIntent);
    setInferredIntent(null);
    if (cleanRunTimer.current) clearTimeout(cleanRunTimer.current);
  }, []);

  const notifyMisconceptionFired = useCallback(() => {
    if (cleanRunTimer.current) clearTimeout(cleanRunTimer.current);
    setInferredIntent(null);
  }, []);

  useEffect(() => {
    if (declaredIntent !== "practice") return;

    cleanRunTimer.current = setTimeout(() => {
      setInferredIntent("record");
    }, autoRecordAfterMs);

    return () => {
      if (cleanRunTimer.current) clearTimeout(cleanRunTimer.current);
    };
  }, [declaredIntent, autoRecordAfterMs]);

  const intent: SessionIntent = inferredIntent ?? declaredIntent;

  const isLearningMode = intent === "learn" || intent === "practice";
  const isPerformanceMode = intent === "record";
  const isCreativeMode = intent === "explore";
  const isAutoInferred = inferredIntent !== null;

  return {
    intent,
    declaredIntent,
    inferredIntent,
    isAutoInferred,
    setSessionIntent,
    notifyMisconceptionFired,
    isLearningMode,
    isPerformanceMode,
    isCreativeMode,
  };
}