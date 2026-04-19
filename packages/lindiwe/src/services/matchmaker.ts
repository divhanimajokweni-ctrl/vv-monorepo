export interface MatchmakerInput {
  memberId: string;
  preferences: Record<string, unknown>;
}

export function generateProsperityOpportunity(input: MatchmakerInput) {
  return { opportunityId: 'new', score: 0.8 };
}