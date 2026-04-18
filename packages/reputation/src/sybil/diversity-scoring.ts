export function computeDiversitySignal(params: {
  uniqueCounterparties: number;
  totalTransactions: number;
}): number {
  const { uniqueCounterparties, totalTransactions } = params;
  if (totalTransactions === 0) return 0;

  const ratio = uniqueCounterparties / totalTransactions;

  // Mirrors 0.3 threshold from detectSybilNodes in fraud-detection.ts
  if (ratio < 0.3) return 0;
  if (ratio >= 1.0) return 1.0;

  // Linear ramp from 0.3→0 to 1.0→1.0
  return (ratio - 0.3) / 0.7;
}
