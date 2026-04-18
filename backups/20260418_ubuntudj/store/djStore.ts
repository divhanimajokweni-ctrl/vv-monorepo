// store/djStore.ts
// REPLACES: the module-level mutable sessionContext singleton
// WHY: Zustand lives outside the React tree, resets cleanly per session,
//      never double-fires in Strict Mode, and is testable in isolation.

import { create } from "zustand";
import { Misconception, DetectionContext } from "../types";

interface DJStore {
  context: DetectionContext;
  pushAction: (action: any) => void;
  incrementCrossfader: () => void;
  incrementCuePoints: () => void;
  updateLastMidOrHighChange: () => void;
  pushTrack: (track: any) => void;
  resetContext: () => void;

  activeAlert: Misconception | null;
  setActiveAlert: (mis: Misconception | null) => void;

  recentAlertIds: { id: string; at: number }[];
  isOnCooldown: (misconceptionId: string) => boolean;
  markAlerted: (misconceptionId: string) => void;
}

const INITIAL_CONTEXT: DetectionContext = {
  recentActions: [],
  crossfaderMovements: 0,
  previousTracks: [],
  cuePointsSet: 0,
  lastMidOrHighChange: Date.now(),
};

export const useDJStore = create<DJStore>((set, get) => ({
  context: { ...INITIAL_CONTEXT },

  pushAction: (action) =>
    set((s) => ({
      context: {
        ...s.context,
        recentActions: [action, ...s.context.recentActions].slice(0, 50),
      },
    })),

  incrementCrossfader: () =>
    set((s) => ({
      context: {
        ...s.context,
        crossfaderMovements: s.context.crossfaderMovements + 1,
      },
    })),

  incrementCuePoints: () =>
    set((s) => ({
      context: {
        ...s.context,
        cuePointsSet: s.context.cuePointsSet + 1,
      },
    })),

  updateLastMidOrHighChange: () =>
    set((s) => ({
      context: { ...s.context, lastMidOrHighChange: Date.now() },
    })),

  pushTrack: (track) =>
    set((s) => ({
      context: {
        ...s.context,
        previousTracks: [...s.context.previousTracks, track],
      },
    })),

  resetContext: () =>
    set({ context: { ...INITIAL_CONTEXT, lastMidOrHighChange: Date.now() } }),

  activeAlert: null,
  setActiveAlert: (mis) => set({ activeAlert: mis }),

  recentAlertIds: [],

  isOnCooldown: (id) => {
    const COOLDOWN_MS = 60_000;
    return get().recentAlertIds.some(
      (r) => r.id === id && Date.now() - r.at < COOLDOWN_MS
    );
  },

  markAlerted: (id) =>
    set((s) => ({
      recentAlertIds: [
        { id, at: Date.now() },
        ...s.recentAlertIds.filter((r) => Date.now() - r.at < 300_000),
      ],
    })),
}));