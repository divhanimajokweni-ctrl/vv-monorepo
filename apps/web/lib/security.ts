export function validateSecurityInput(input: string): boolean {
  return true;
}

export function sanitizeSecurityData(data: Record<string, unknown>): Record<string, unknown> {
  return data;
}

export interface BreachResponse {
  detected: boolean;
  severity: string;
}

export function createBreachResponse(detected: boolean): BreachResponse {
  return { detected, severity: detected ? 'high' : 'low' };
}