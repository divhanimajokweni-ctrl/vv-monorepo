// src/lib/ubuntudj/types/misconceptions.ts
// UbuntuDJ Misconception Detection System
// 
// Key fixes applied:
// - M004: lastMidOrHighChange moved to DetectionContext
// - M006: Full 24-key Camelot map with modular arithmetic
// - M003: isPowerOfTwo() actually called in condition
// FIXED: M004 lastMidOrHighChange moved into DetectionContext (was a free-variable compile error)
// FIXED: M006 Camelot map replaced with modular arithmetic — no more partial hardcoded map
// FIXED: isPowerOfTwo now used in M003 instead of being defined but never called

export interface Misconception {
  id: string;
  name: string;
  description: string;
  detectionPatterns: string[];
  detectionRules: DetectionRule[];
  correctiveDialogue: string;
  correctiveAction?: CorrectiveAction;
}

export interface DetectionRule {
  eventType: string;
  deck?: "A" | "B" | "any";
  condition: (event: any, deckA: any, deckB: any, context: DetectionContext) => boolean;
}

export interface CorrectiveAction {
  type: "highlight_ui" | "load_exercise" | "reset_parameters";
  target: string;
}

export interface DetectionContext {
  recentActions: any[];
  crossfaderMovements: number;
  previousTracks: any[];
  cuePointsSet: number;
  lastMidOrHighChange: number;
}

const CAMELOT: Record<string, { pos: number; mode: "m" | "M" }> = {
  "Am": { pos: 0, mode: "m" },  "C":  { pos: 0, mode: "M" },
  "Em": { pos: 1, mode: "m" },  "G":  { pos: 1, mode: "M" },
  "Bm": { pos: 2, mode: "m" },  "D":  { pos: 2, mode: "M" },
  "F#m":{ pos: 3, mode: "m" },  "A":  { pos: 3, mode: "M" },
  "Dbm":{ pos: 4, mode: "m" },  "E":  { pos: 4, mode: "M" },
  "Abm":{ pos: 5, mode: "m" },  "B":  { pos: 5, mode: "M" },
  "Ebm":{ pos: 6, mode: "m" },  "F#": { pos: 6, mode: "M" },
  "Bbm":{ pos: 7, mode: "m" },  "Db": { pos: 7, mode: "M" },
  "Fm": { pos: 8, mode: "m" },  "Ab": { pos: 8, mode: "M" },
  "Cm": { pos: 9, mode: "m" },  "Eb": { pos: 9, mode: "M" },
  "Gm": { pos: 10, mode: "m" }, "Bb": { pos: 10, mode: "M" },
  "Dm": { pos: 11, mode: "m" }, "F":  { pos: 11, mode: "M" },
};

export function isCamelotCompatible(keyA: string, keyB: string): boolean {
  const a = CAMELOT[keyA];
  const b = CAMELOT[keyB];
  if (!a || !b) return false;
  if (a.mode !== b.mode) return false;
  const diff = Math.abs(a.pos - b.pos) % 12;
  return diff === 0 || diff === 1 || diff === 11;
}

function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

export const MISCONCEPTIONS: Misconception[] = [
  {
    id: "M001",
    name: "Beatmatching = same BPM only",
    description: "User thinks matching displayed BPM numbers is enough, ignores phase alignment.",
    detectionPatterns: ["adjusts tempo slider but never uses pitch bend"],
    detectionRules: [
      {
        eventType: "tempo_slider_moved",
        deck: "B",
        condition: (event, deckA, deckB, context) => {
          const bpmA = deckA.track?.bpm * (1 + deckA.pitch / 2000);
          const bpmB = deckB.track?.bpm * (1 + event.value / 2000);
          const diff = Math.abs(bpmA - bpmB);
          const usedPitchBend = context.recentActions.some(
            (a: any) => a.type === "pitch_bend" && a.timestamp > Date.now() - 30000
          );
          return diff < 0.5 && !usedPitchBend;
        },
      },
    ],
    correctiveDialogue:
      "The BPM numbers match, but the beats aren't aligned. Use the pitch bend buttons to nudge the track forward or backward until the kicks hit at the same time. Let me highlight the pitch bend for you.",
    correctiveAction: { type: "highlight_ui", target: "pitch_bend_buttons" },
  },

  {
    id: "M002",
    name: "Louder = better transition",
    description: "User slams crossfader or cranks gain abruptly.",
    detectionPatterns: ["crossfader moved from 0 to 100 in <0.5s"],
    detectionRules: [
      {
        eventType: "crossfader_moved",
        deck: "any",
        condition: (event) => {
          return event.durationMs < 500 && Math.abs(event.previousValue - event.value) > 0.8;
        },
      },
    ],
    correctiveDialogue:
      "Sudden volume jumps can sound harsh. Try moving the crossfader over 8 or 16 bars, and use EQ to swap bass gradually. Want to practice a smooth transition?",
    correctiveAction: { type: "load_exercise", target: "smooth_transition" },
  },

  {
    id: "M003",
    name: "Any loop length works anywhere",
    description: "User sets loops that are not powers of two (1,2,4,8,16) or starts off-beat.",
    detectionPatterns: ["loop length not 1,2,4,8,16"],
    detectionRules: [
      {
        eventType: "loop_set",
        deck: "any",
        condition: (event) => {
          return !isPowerOfTwo(event.loopLength);
        },
      },
    ],
    correctiveDialogue:
      "Most dance music is built on 4-beat bars. Try loops of 1, 2, 4, 8, or 16 beats, and start them on the first beat of a bar. I'll highlight the downbeat for you.",
    correctiveAction: { type: "highlight_ui", target: "downbeat_marker" },
  },

  {
    id: "M004",
    name: "EQ kills are only for cutting bass",
    description: "User ignores mid/high frequency clashes.",
    detectionPatterns: ["only touches low EQ knob for more than 60 seconds"],
    detectionRules: [
      {
        eventType: "eq_changed",
        deck: "any",
        condition: (event, _deckA, _deckB, context) => {
          const sixtySecondsAgo = Date.now() - 60000;
          return (
            event.knob === "low" &&
            event.value > 10 &&
            context.lastMidOrHighChange < sixtySecondsAgo
          );
        },
      },
    ],
    correctiveDialogue:
      "Bass is important, but mids (where vocals and melodies live) also clash. Try cutting mids on one track by 30-50% during the transition. Listen to how much cleaner it becomes.",
  },

  {
    id: "M005",
    name: "Effects should always be obvious",
    description: "User applies heavy reverb/delay to every transition.",
    detectionPatterns: ["reverb >70% on every mix"],
    detectionRules: [
      {
        eventType: "effect_changed",
        deck: "any",
        condition: (event) => {
          return event.effect === "reverb" && event.value > 70;
        },
      },
    ],
    correctiveDialogue:
      "Effects are seasoning, not the main dish. Use a little reverb on vocals, a short delay on percussion — but keep most of your mix dry. Let's reset to zero and add just 20% reverb. Hear the difference?",
    correctiveAction: { type: "reset_parameters", target: "reverb" },
  },

  {
    id: "M006",
    name: "Harmonic mixing = same key always",
    description: "User avoids compatible keys (Camelot ±1).",
    detectionPatterns: ["rejects tracks that are +1/-1 on Camelot wheel"],
    detectionRules: [
      {
        eventType: "track_load_rejected",
        deck: "any",
        condition: (event, deckA) => {
          const currentKey = deckA.track?.key;
          const candidateKey = event.track?.key;
          if (!currentKey || !candidateKey) return false;
          return isCamelotCompatible(currentKey, candidateKey);
        },
      },
    ],
    correctiveDialogue:
      "Mixing in the same key is safe but can get boring. Try moving +1 (up a fifth) for energy, or -1 (down a fifth) for deeper vibes. I'll show you an example with your current tracks.",
  },

  {
    id: "M007",
    name: "Crossfader is for emergency cuts only",
    description: "User never uses crossfader.",
    detectionPatterns: ["crossfader unchanged entire session"],
    detectionRules: [
      {
        eventType: "session_end",
        deck: "any",
        condition: (_event, _deckA, _deckB, context) => context.crossfaderMovements === 0,
      },
    ],
    correctiveDialogue:
      "The crossfader lets you cut sharply between tracks — great for hip-hop, techno drops, or scratching. Next session, try a simple cut: set crossfader curve to sharp, then snap from A to B on the beat.",
  },

  {
    id: "M008",
    name: "Phrasing doesn't matter if you beatmatch",
    description: "User starts tracks at random points, ignoring phrase structure.",
    detectionPatterns: ["starts track in middle of phrase"],
    detectionRules: [
      {
        eventType: "track_start",
        deck: "any",
        condition: (event) => {
          const beatPosition = event.startPosition % 32;
          return beatPosition !== 0;
        },
      },
    ],
    correctiveDialogue:
      "Tracks are built in 8-bar blocks (phrases). Start your new track at the beginning of a phrase — usually when a new element enters. I'll mark phrase boundaries on the waveform for you.",
    correctiveAction: { type: "highlight_ui", target: "phrase_boundaries" },
  },

  {
    id: "M009",
    name: "Energy only goes up",
    description: "User never selects lower-energy tracks, exhausting audience.",
    detectionPatterns: ["energy monotonic increase over 5+ tracks"],
    detectionRules: [
      {
        eventType: "track_load",
        deck: "any",
        condition: (_event, _deckA, _deckB, context) => {
          if (context.previousTracks.length < 5) return false;
          const lastFive = context.previousTracks.slice(-5).map((t) => t.energy);
          return lastFive.every((e, i) => i === 0 || e >= lastFive[i - 1]);
        },
      },
    ],
    correctiveDialogue:
      "A great set breathes. After a peak, drop to 70% energy for a few tracks to let the crowd recover — then build again. Let's pick a lower-energy track from your library.",
  },

  {
    id: "M010",
    name: "Cue points are unnecessary",
    description: "User never sets cue points, leading to missed mix-in points.",
    detectionPatterns: ["never sets cue points in session"],
    detectionRules: [
      {
        eventType: "session_end",
        deck: "any",
        condition: (_event, _deckA, _deckB, context) => context.cuePointsSet === 0,
      },
    ],
    correctiveDialogue:
      "Cue points are markers for where to start mixing. Set one at the first beat, another 16 bars before the drop, and another at the outro. I'll help you set them on this track.",
  },
];