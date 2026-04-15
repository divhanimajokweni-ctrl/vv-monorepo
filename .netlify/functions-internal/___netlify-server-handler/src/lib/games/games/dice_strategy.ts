// src/lib/games/games/dice_strategy.ts
import type { GameState, GameDecision } from '../types';

export async function processAction(currentState: GameState, action: { type: string; payload: Record<string, unknown> }) {
  if (action.type !== 'roll') throw new Error('Invalid action');

  const { betAmount, targetMultiplier } = action.payload as { betAmount: number; targetMultiplier: number };
  let currentMultiplier = 1;
  const rolls: number[] = [];
  const maxRolls = 5;

  for (let i = 0; i < maxRolls; i++) {
    const roll = Math.floor(Math.random() * 6) + 1;
    rolls.push(roll);
    currentMultiplier *= (roll > 3 ? 1.2 : 0.8);

    if (currentMultiplier >= targetMultiplier) {
      break;
    }
  }

  const won = currentMultiplier >= targetMultiplier;
  const profit = won ? betAmount * currentMultiplier - betAmount : -betAmount;

  const decision: GameDecision = {
    round: currentState.round,
    type: 'dice_roll',
    choice: `Bet ${betAmount} for ${targetMultiplier}x`,
    outcome: won ? 'positive' : 'negative',
    reasoning: won ? 'Achieved target' : 'Failed to reach target',
    timestamp: Date.now(),
  };

  const newState: GameState = {
    ...currentState,
    round: currentState.round + 1,
    score: currentState.score + profit,
    phase: currentState.round >= currentState.maxRounds ? 'ended' : 'roll',
    data: {
      ...currentState.data,
      rolls: [...(currentState.data.rolls as any[]), rolls],
      currentMultiplier,
      target: targetMultiplier,
    },
    decisions: [...currentState.decisions, decision],
  };

  return { newState, decision };
}