// Currency handling utilities for ZAR (South African Rand)

export const ZAR_MINOR_UNITS = 100; // 1 ZAR = 100 cents

export function toMinorUnits(amount: number): number {
  return Math.round(amount * ZAR_MINOR_UNITS);
}

export function fromMinorUnits(minorUnits: number): number {
  return minorUnits / ZAR_MINOR_UNITS;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
}

export function parseCurrency(input: string): number {
  // Remove currency symbols and parse
  const cleaned = input.replace(/R|\s|,/g, '');
  return parseFloat(cleaned) || 0;
}