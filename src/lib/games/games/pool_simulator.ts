/**
 * Pool Simulator — Game Logic
 * Manage a ROSCA pool of 8 simulated members through 12 months of realistic disruptions.
 */
import type { GameState, GameDecision } from '../types';
 
const EVENTS = [
  { month: 2,  type: 'missed_contribution', member: 3, description: 'Member 3 missed contribution — medical emergency' },
  { month: 4,  type: 'late_contribution',   member: 6, description: 'Member 6 late — job loss' },
  { month: 7,  type: 'default_risk',        member: 1, description: 'Member 1 at default risk — consistent lateness' },
  { month: 10, type: 'market_downturn',     member: 0, description: 'Regional market downturn — 3 members reduced capacity' },
];
 
export async function processAction(
  state: GameState,
  action: { type: string; payload: Record<string, unknown> }
): Promise<{ newState: GameState; decision: GameDecision }> {
  const newState = structuredClone(state);
  let outcome: 'positive' | 'negative' | 'neutral' = 'neutral';
  let reasoning = '';
 
  switch (action.type) {
    case 'grant_extension':
      newState.score += 10;
      outcome   = 'positive';
      reasoning = 'Compassionate extension maintains member trust and pool cohesion';
      break;
 
    case 'enforce_default':
      newState.score += 5; // Sometimes necessary, lower score than extension
      outcome   = 'neutral';
      reasoning = 'Default enforcement protects pool integrity but risks trust erosion';
      break;
 
    case 'draw_buffer':
      newState.score += 8;
      outcome   = 'positive';
      reasoning = 'Buffer deployment demonstrates forward-thinking pool governance';
      break;
 
    case 'mediate_dispute':
      newState.score += 20;
      outcome   = 'positive';
      reasoning = 'Mediation resolves conflict without constitutional penalty';
      break;
 
    case 'end_month':
      newState.round += 1;
      // Inject scripted events
      const event = EVENTS.find(e => e.month === newState.round);
      if (event) {
        (newState.data as { currentEvent?: typeof event }).currentEvent = event;
      }
      if (newState.round > newState.maxRounds) newState.phase = 'ended';
      break;
  }
 
  const decision: GameDecision = {
    round:     state.round,
    type:      action.type,
    choice:    JSON.stringify(action.payload),
    outcome,
    reasoning,
    timestamp: Date.now(),
  };
 
  newState.decisions = [...(newState.decisions ?? []), decision];
  return { newState, decision };
}
