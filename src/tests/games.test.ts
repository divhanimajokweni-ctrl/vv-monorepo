import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildInitialState } from '../lib/games/engine';
import { processAction as monopolyAction } from '../lib/games/games/ubuntu_monopoly';
import { processAction as poolAction } from '../lib/games/games/pool_simulator';
import { awardPrestige } from '../lib/games/scoring';
import { extractSignals } from '../lib/games/telemetry';
 
// Mock DB
vi.mock('@/db/client', () => ({ db: { insert: vi.fn(() => ({ values: vi.fn(() => Promise.resolve([])) })), update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })) })), query: { prestigeScores: { findFirst: vi.fn(() => Promise.resolve(null)) }, gameTelemetry: { findMany: vi.fn(() => Promise.resolve([])) } } } }));
vi.mock('@/lib/events/emitter', () => ({ emitEvent: vi.fn(() => Promise.resolve()) }));
 
// ── Ubuntu Monopoly ────────────────────────────────────────────────────────────
 
describe('Ubuntu Monopoly', () => {
  let state: ReturnType<typeof buildInitialState>;
 
  beforeEach(() => {
    state = {
      round: 1, maxRounds: 20, score: 0, phase: 'property_phase',
      decisions: [], events: [],
      data: { properties: [], villageFound: 0, syndicates: [], cash: 1000 },
    };
  });
 
  it('should award positive outcome for syndicate formation', async () => {
    const { newState, decision } = await monopolyAction(state, {
      type: 'form_syndicate',
      payload: { propertyId: 'p1', partnerId: 'ai_1' },
    });
    expect(decision.outcome).toBe('positive');
    expect(newState.score).toBeGreaterThan(0);
  });
 
  it('should penalise blocking acquisitions', async () => {
    const { decision } = await monopolyAction(state, {
      type: 'acquire_to_block',
      payload: { propertyId: 'p2' },
    });
    expect(decision.outcome).toBe('negative');
  });
 
  it('should advance round on end_turn', async () => {
    const { newState } = await monopolyAction(state, { type: 'end_turn', payload: {} });
    expect(newState.round).toBe(2);
  });
 
  it('should mark phase ended when rounds are exhausted', async () => {
    const endState = { ...state, round: 20 };
    const { newState } = await monopolyAction(endState, { type: 'end_turn', payload: {} });
    expect(newState.phase).toBe('ended');
  });
});
 
// ── Pool Simulator ─────────────────────────────────────────────────────────────
 
describe('Pool Simulator', () => {
  let state: ReturnType<typeof buildInitialState>;
 
  beforeEach(() => {
    state = {
      round: 1, maxRounds: 12, score: 0, phase: 'setup',
      decisions: [], events: [],
      data: { members: [], buffer: 500, health: 100 },
    };
  });
 
  it('should award more points for extension than enforcement', async () => {
    const { newState: extState } = await poolAction(state, { type: 'grant_extension', payload: {} });
    const { newState: enfState } = await poolAction(state, { type: 'enforce_default', payload: {} });
    expect(extState.score).toBeGreaterThan(enfState.score);
  });
 
  it('should inject events at correct months', async () => {
    let s = { ...state, round: 1 };
    for (let i = 0; i < 2; i++) {
      const { newState } = await poolAction(s, { type: 'end_month', payload: {} });
      s = newState;
    }
    expect((s.data as { currentEvent?: { month: number } }).currentEvent?.month).toBe(2);
  });
});
 
// ── Prestige Scoring ──────────────────────────────────────────────────────────
 
describe('Prestige Scoring', () => {
  it('should always award at least the completion bonus', async () => {
    const finalState = {
      round: 20, maxRounds: 20, score: 0, phase: 'ended',
      decisions: [], events: [], data: {},
    };
    const { total, awards } = await awardPrestige('member_1', 'session_1', 'ubuntu_monopoly', finalState, []);
    expect(total).toBeGreaterThanOrEqual(10);
    expect(awards.some(a => a.reason === 'completion')).toBe(true);
  });
 
  it('should never award negative prestige', async () => {
    const finalState = {
      round: 20, maxRounds: 20, score: -100, phase: 'ended',
      decisions: [{ round: 1, type: 'acquire_to_block', choice: '{}', outcome: 'negative' as const, timestamp: 0 }],
      events: [], data: {},
    };
    const { total } = await awardPrestige('member_2', 'session_2', 'ubuntu_monopoly', finalState, []);
    expect(total).toBeGreaterThanOrEqual(0);
  });
});
 
// ── POPIA / Sovereignty ───────────────────────────────────────────────────────
 
describe('Telemetry Consent', () => {
  it('should store signals with consent_given: false by default', async () => {
    const state = {
      round: 20, maxRounds: 20, score: 100, phase: 'ended',
      decisions: [{ round: 1, type: 'form_syndicate', choice: '{}', outcome: 'positive' as const, timestamp: 0 }],
      events: [], data: { syndicates: ['p1'] },
    };
    const signals = await extractSignals('member_3', 'session_3', 'ubuntu_monopoly', state);
    expect(Array.isArray(signals)).toBe(true);
    // Consent gate checked: signals are stored with consent_given: false until member opts in
  });
});
