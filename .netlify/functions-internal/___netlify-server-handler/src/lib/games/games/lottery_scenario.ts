// src/lib/games/games/lottery_scenario.ts
import type { GameState, GameDecision } from '../types';

const scenarios = [
  { name: 'Rent Week', choices: ['Pay Rent (safe)', 'Buy Ticket (gamble)'], weights: [0.8, 0.2] },
  { name: 'Windfall', choices: ['Save All', 'Invest Half', 'Bet Half'], weights: [0.5, 0.3, 0.2] },
  { name: 'Emergency', choices: ['Use Savings', 'Borrow', 'Gamble Solution'], weights: [0.6, 0.3, 0.1] },
];

export async function processAction(currentState: GameState, action: { type: string; payload: Record<string, unknown> }) {
  if (action.type !== 'choose') throw new Error('Invalid action');

  const { scenarioIndex, choiceIndex } = action.payload as { scenarioIndex: number; choiceIndex: number };
  const scenario = scenarios[scenarioIndex];
  const outcome = Math.random() < scenario.weights[choiceIndex] ? 'win' : 'loss';
  const points = outcome === 'win' ? 1000 : -500;

  const decision: GameDecision = {
    round: currentState.round,
    type: 'scenario_choice',
    choice: scenario.choices[choiceIndex],
    outcome: outcome === 'win' ? 'positive' : 'negative',
    reasoning: outcome === 'win' ? 'Good choice' : 'Risky choice',
    timestamp: Date.now(),
  };

  const newState: GameState = {
    ...currentState,
    round: currentState.round + 1,
    score: currentState.score + points,
    phase: currentState.round >= currentState.maxRounds ? 'ended' : 'scenario',
    data: {
      ...currentState.data,
      scenarios: [...(currentState.data.scenarios as any[]), { scenarioIndex, choiceIndex, outcome, points }],
      currentIndex: (currentState.data.currentIndex as number) + 1,
      totalPoints: (currentState.data.totalPoints as number) + points,
    },
    decisions: [...currentState.decisions, decision],
  };

  return { newState, decision };
}