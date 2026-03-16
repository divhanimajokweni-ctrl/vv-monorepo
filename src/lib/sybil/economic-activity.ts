const MIN_ACCOUNT_AGE_DAYS = 7;

export function computeEconomicActivitySignal(params: {
  accountAgeDays: number;
  loanCount: number;
  repaymentCount: number;
  savingsContributions: number;
}): number {
  if (params.accountAgeDays < MIN_ACCOUNT_AGE_DAYS) return 0;

  const { loanCount, repaymentCount, savingsContributions } = params;
  const total = loanCount + repaymentCount + savingsContributions;

  if (total === 0) return 0;

  // Repayments weighted heavily as they demonstrate commitment
  const weighted =
    loanCount * 0.2 + repaymentCount * 0.5 + savingsContributions * 0.3;

  // Ramp: 0 at 0 weighted, 1.0 at 20+ weighted points
  return Math.min(weighted / 20, 1.0);
}

export function computeTransactionFrictionSignal(params: {
  totalTransactions: number;
  minTransactions: number;
}): number {
  const { totalTransactions, minTransactions } = params;
  if (minTransactions <= 0) return 1.0;
  if (totalTransactions < minTransactions) return 0;

  const target = minTransactions * 2;
  if (totalTransactions >= target) return 1.0;

  return (totalTransactions - minTransactions) / (target - minTransactions);
}
