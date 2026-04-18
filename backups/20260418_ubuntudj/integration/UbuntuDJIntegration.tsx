// src/lib/ubuntudj/integration/UbuntuDJIntegration.tsx
// ============================================================================
// Integration snippet showing how to wire the Zustand store, detector, and hooks.
// Use this as a reference to integrate into your existing UbuntuDJ component.
// ============================================================================

import { useCallback, useEffect } from "react";
import { useDJStore } from "../store/djStore";
import { useMisconceptionHistory } from "../hooks/useMisconceptionHistory";
import { useSessionIntent } from "../hooks/useSessionIntent";
import { 
  detectMisconception, 
  UserActionEvent, 
  DeckState,
  SessionIntent 
} from "../detector/misconceptionDetector";

export function useUbuntuDJIntegration(dA: DeckState, dB: DeckState) {
  const {
    context,
    pushAction,
    incrementCrossfader,
    incrementCuePoints,
    updateLastMidOrHighChange,
    pushTrack,
    resetContext,
    setActiveAlert,
    isOnCooldown,
    markAlerted,
  } = useDJStore();

  const {
    intent: sessionIntent,
    setSessionIntent,
    notifyMisconceptionFired,
    isAutoInferred,
    inferredIntent,
  } = useSessionIntent("practice");

  const {
    recordMisconception,
    recordSelfCorrection,
    getUnresolvedByFrequency,
    overallSkillScore,
  } = useMisconceptionHistory();

  useEffect(() => {
    resetContext();
  }, [sessionIntent, resetContext]);

  const handleUserAction = useCallback(
    (event: UserActionEvent) => {
      pushAction({ ...event, timestamp: event.timestamp ?? Date.now() });

      if (event.type === "crossfader_moved") incrementCrossfader();
      if (event.type === "cue_point_set") incrementCuePoints();
      if (event.type === "eq_changed" && event.knob !== "low") updateLastMidOrHighChange();
      if (event.type === "track_load" && event.track) pushTrack(event.track);

      const mis = detectMisconception(
        event,
        dA,
        dB,
        context,
        sessionIntent,
        isOnCooldown
      );

      if (mis && !isOnCooldown(mis.id)) {
        markAlerted(mis.id);
        notifyMisconceptionFired();
        recordMisconception(mis);
        setActiveAlert(mis);
        sendToLindiwe(mis.correctiveDialogue);

        if (mis.correctiveAction) {
          if (mis.correctiveAction.type === "highlight_ui") {
            highlightElement(mis.correctiveAction.target);
          } else if (mis.correctiveAction.type === "load_exercise") {
            loadExercise(mis.correctiveAction.target);
          } else if (mis.correctiveAction.type === "reset_parameters") {
            if (mis.correctiveAction.target === "reverb") {
              setReverb(0);
            }
          }
        }
      }
    },
    [
      context,
      sessionIntent,
      dA,
      dB,
      pushAction,
      incrementCrossfader,
      incrementCuePoints,
      updateLastMidOrHighChange,
      pushTrack,
      isOnCooldown,
      markAlerted,
      notifyMisconceptionFired,
      recordMisconception,
      setActiveAlert,
    ]
  );

  const handlePitchBendUsed = useCallback(() => {
    handleUserAction({ type: "pitch_bend", deck: "B", timestamp: Date.now() });
    recordSelfCorrection("M001");
  }, [handleUserAction, recordSelfCorrection]);

  const unresolvedMisconceptions = getUnresolvedByFrequency();
  const skillScore = overallSkillScore();

  return {
    handleUserAction,
    handlePitchBendUsed,
    sessionIntent,
    setSessionIntent,
    isAutoInferred,
    inferredIntent,
    unresolvedMisconceptions,
    skillScore,
  };
}

// ============================================================================
// UTILITY FUNCTIONS (implement these in your component)
// ============================================================================

function sendToLindiwe(message: string) {
  console.log("[Lindiwe]", message);
}

function highlightElement(target: string) {
  console.log("[UI] Highlight:", target);
}

function loadExercise(target: string) {
  console.log("[Exercise] Load:", target);
}

function setReverb(value: number) {
  console.log("[FX] Reverb:", value);
}