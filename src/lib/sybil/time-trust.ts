const BREAKPOINTS: [number, number][] = [
  [7, 0],
  [30, 0.3],
  [90, 0.6],
  [180, 0.8],
  [365, 1.0],
];

export function computeTimeTrustSignal(
  accountCreatedAt: Date,
  now: Date = new Date()
): number {
  const days =
    (now.getTime() - accountCreatedAt.getTime()) / (1000 * 60 * 60 * 24);

  if (days < BREAKPOINTS[0][0]) return 0;
  if (days >= BREAKPOINTS[BREAKPOINTS.length - 1][0]) return 1.0;

  for (let i = 1; i < BREAKPOINTS.length; i++) {
    const [dHigh, sHigh] = BREAKPOINTS[i];
    const [dLow, sLow] = BREAKPOINTS[i - 1];
    if (days < dHigh) {
      const t = (days - dLow) / (dHigh - dLow);
      return sLow + t * (sHigh - sLow);
    }
  }

  return 1.0;
}
