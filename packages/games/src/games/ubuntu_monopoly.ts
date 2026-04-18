/**
 * Ubuntu Monopoly — Game Logic
 * Core rule: collective property syndicates outperform individual monopolies.
 * Rent income splits between owner and village fund each round.
 */
import type { GameState, GameDecision } from '../types';
 
type Action =
  | { type: 'acquire_property';  payload: { propertyId: string; price: number } }
  | { type: 'form_syndicate';    payload: { propertyId: string; partnerId: string } }
  | { type: 'fund_village';      payload: { amount: number } }
  | { type: 'collect_rent';      payload: { propertyId: string } }
  | { type: 'acquire_to_block';  payload: { propertyId: string } }
  | { type: 'end_turn';          payload: Record<string, never> };
 
export async function processAction(
  state: GameState,
  action: { type: string; payload: Record<string, unknown> }
): Promise<{ newState: GameState; decision: GameDecision }> {
  const newState = structuredClone(state);
  let outcome: 'positive' | 'negative' | 'neutral' = 'neutral';
  let reasoning = '';
 
  const data = newState.data as {
    properties: Array<{ id: string; ownerId: string; syndicated: boolean; value: number }>;
    villageFound: number;
    syndicates: string[];
    cash: number;
  };
 
  switch (action.type) {
    case 'form_syndicate':
      data.syndicates = [...(data.syndicates ?? []), action.payload.propertyId as string];
      newState.score += 25; // Syndicates generate bonus compounding
      outcome    = 'positive';
      reasoning  = 'Syndicate formation enables compound returns through collective ownership';
      break;
 
    case 'fund_village':
      data.villageFound = (data.villageFound ?? 0) + (action.payload.amount as number);
      newState.score += 15;
      outcome   = 'positive';
      reasoning = 'Village fund contribution strengthens collective infrastructure';
      break;
 
    case 'acquire_to_block':
      outcome   = 'negative';
      reasoning = 'Blocking acquisition is individual-competitive strategy; reduces collective score';
      newState.score -= 5;
      break;
 
    case 'end_turn':
      newState.round += 1;
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
