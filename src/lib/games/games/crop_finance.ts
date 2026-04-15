// src/lib/games/games/crop_finance.ts
import type { GameState, GameDecision } from '../types';

const seasons = ['Planting', 'Growing', 'Harvest', 'Market'];
const weatherRisks = ['Drought', 'Flood', 'Pest', 'Perfect'];

export async function processAction(currentState: GameState, action: { type: string; payload: Record<string, unknown> }) {
  if (action.type !== 'plant') throw new Error('Invalid action');

  const { cropChoice, insuranceChoice } = action.payload as { cropChoice: string; insuranceChoice: boolean };
  const weather = weatherRisks[Math.floor(Math.random() * 4)];
  let yield_multiplier = 1.0;

  if (weather === 'Drought') yield_multiplier = 0.3;
  if (weather === 'Flood') yield_multiplier = 0.5;
  if (weather === 'Pest') yield_multiplier = 0.7;
  if (weather === 'Perfect') yield_multiplier = 1.5;

  const insurancePayout = insuranceChoice ? (1 - yield_multiplier) * 1000 : 0;
  const finalMoney = (cropChoice === 'maize' ? 800 : 1200) * yield_multiplier + insurancePayout;

  const decision: GameDecision = {
    round: currentState.round,
    type: 'crop_plant',
    choice: `${cropChoice} with insurance: ${insuranceChoice}`,
    outcome: yield_multiplier > 0.8 ? 'positive' : 'negative',
    reasoning: `Weather: ${weather}, Yield: ${yield_multiplier}`,
    timestamp: Date.now(),
  };

  const newState: GameState = {
    ...currentState,
    round: currentState.round + 1,
    score: currentState.score + finalMoney,
    phase: currentState.round >= currentState.maxRounds ? 'ended' : 'season',
    data: {
      ...currentState.data,
      seasons: [...(currentState.data.seasons as any[]), { cropChoice, insuranceChoice, weather, finalMoney }],
      totalMoney: (currentState.data.totalMoney as number) + finalMoney,
      insurance: insuranceChoice,
    },
    decisions: [...currentState.decisions, decision],
  };

  return { newState, decision };
}