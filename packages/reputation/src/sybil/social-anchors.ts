export function computeSocialAnchorSignal(params: {
  sponsorId: string | null;
  inviteDepth: number;
  sponsorScore: number;
  maxDepth?: number;
}): number {
  const { sponsorId, inviteDepth, sponsorScore, maxDepth = 5 } = params;

  if (!sponsorId) return 0;

  // Deeper invites = weaker signal
  const depthFactor = Math.max(0, 1 - inviteDepth / maxDepth);

  // Sponsor score normalized to 0-1
  const sponsorFactor = sponsorScore / 100;

  return depthFactor * sponsorFactor;
}

export function calculateSponsorPenalty(
  _sponsorId: string,
  flaggedInvitees: number,
  totalInvitees: number
): number {
  if (totalInvitees === 0) return 1.0;

  const flagRatio = flaggedInvitees / totalInvitees;

  // No penalty below 20% flagged
  if (flagRatio < 0.2) return 1.0;
  // Full penalty at 80%+ flagged
  if (flagRatio >= 0.8) return 0;

  return 1.0 - (flagRatio - 0.2) / 0.6;
}
