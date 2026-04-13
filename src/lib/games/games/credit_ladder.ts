/**
 * Credit Ladder — Game Logic
 * Climb the credit ladder by managing debt, making strategic borrowing and repayment decisions.
 * 15 rounds of increasingly complex financial choices.
 */
import type { GameState, GameDecision } from '../types';

const CREDIT_TIERS = [
  { name: 'Bronze', limit: 1000, score: 300 },
  { name: 'Silver', limit: 2500, score: 500 },
  { name: 'Gold',   limit: 5000, score: 700 },
  { name: 'Platinum', limit: 10000, score: 900 },
  { name: 'Diamond',  limit: 25000, score: 1100 },
];

export async function processAction(
  state: GameState,
  action: { type: string; payload: Record<string, unknown> }
): Promise<{ newState: GameState; decision: GameDecision }> {
  const newState = structuredClone(state);
  let outcome: 'positive' | 'negative' | 'neutral' = 'neutral';
  let reasoning = '';

  const data = newState.data as {
    creditScore: number;
    creditLimit: number;
    debt: number;
    availableCash: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    tier: string;
    turnEvents: string[];
  };

  switch (action.type) {
    case 'take_loan': {
      const amount = action.payload.amount as number;
      if (amount > data.creditLimit - data.debt) {
        outcome = 'negative';
        reasoning = `Overextension: ${amount} exceeds available credit (${data.creditLimit - data.debt})`;
        newState.score -= 20;
      } else {
        data.debt += amount;
        data.availableCash += amount;
        outcome = 'neutral';
        reasoning = `Borrowed ${amount}, debt now ${data.debt}/${data.creditLimit}`;
        newState.score += 5;
      }
      break;
    }

    case 'minimum_payment': {
      const payment = Math.min(data.debt * 0.03, data.availableCash);
      if (payment > 0) {
        data.debt -= payment;
        data.availableCash -= payment;
        data.creditScore += 5;
        outcome = 'neutral';
        reasoning = `Minimum payment of ${payment.toFixed(2)}, credit score +5`;
        newState.score += 2;
      } else {
        outcome = 'negative';
        reasoning = 'Insufficient cash for minimum payment';
        newState.score -= 10;
        data.creditScore -= 10;
      }
      break;
    }

    case 'early_repayment': {
      const amount = action.payload.amount as number;
      if (amount > data.availableCash) {
        outcome = 'negative';
        reasoning = `Insufficient cash for ${amount} repayment`;
        newState.score -= 5;
      } else {
        data.debt -= amount;
        data.availableCash -= amount;
        data.creditScore += 15;
        outcome = 'positive';
        reasoning = `Early repayment of ${amount}, credit score +15`;
        newState.score += 15;
      }
      break;
    }

    case 'pay_expenses': {
      const expenses = data.monthlyExpenses;
      if (expenses > data.availableCash) {
        outcome = 'negative';
        reasoning = `Can't afford monthly expenses of ${expenses}`;
        newState.score -= 20;
        data.creditScore -= 20;
      } else {
        data.availableCash -= expenses;
        outcome = 'neutral';
        reasoning = `Paid monthly expenses of ${expenses}`;
        newState.score += 5;
      }
      break;
    }

    case 'end_turn': {
      // Update credit limit based on score
      const newTier = CREDIT_TIERS.find(t => data.creditScore >= t.score);
      if (newTier && newTier.name !== data.tier) {
        data.tier = newTier.name;
        data.creditLimit = newTier.limit;
        reasoning += `Upgraded to ${newTier.name} tier! `;
        newState.score += 50;
      }

      // Monthly interest (simple model)
      if (data.debt > 0) {
        const interest = data.debt * 0.02;
        data.debt += interest;
        reasoning += `Monthly interest: ${interest.toFixed(2)}. `;
      }

      // Income
      data.availableCash += data.monthlyIncome;
      reasoning += `Monthly income: ${data.monthlyIncome}. `;

      newState.round += 1;
      if (newState.round > newState.maxRounds) newState.phase = 'ended';
      break;
    }
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
