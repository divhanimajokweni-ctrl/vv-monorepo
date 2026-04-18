/**
 * Ubuntu Pools Games — Prestige Score System
 *
 * Rules:
 * - Prestige is NEVER decremented by game losses
 * - Prestige flows upward into Ubuntu Score as a capped bonus only
 * - Points are earned by demonstrated financial wisdom, not luck
 */
import { db } from '@/db/client';
import { prestigeScores, prestigeLedger } from '@/db/schema-games';
import { eq } from 'drizzle-orm';
import type { GameId, GameState, BehaviouralSignal, PrestigeAward } from './types';
 
const PRESTIGE_PER_LEVEL = 100;
const MAX_UBUNTU_BONUS   = 5; // Ubuntu Score bonus capped at +5
 
export async function awardPrestige(
  memberId:  string,
  sessionId: string,
  gameId:    GameId,
  state:     GameState,
  signals:   BehaviouralSignal[]
): Promise<{ total: number; awards: PrestigeAward[] }> {
  const awards: PrestigeAward[] = [];
 
  // 1. Completion bonus
  awards.push({ points: 10, reason: 'completion', description: `Completed ${gameId} session` });
 
  // 2. Score-based bonus (0–15 pts)
  const scoreBonus = Math.round((state.score / 1000) * 15);
  if (scoreBonus > 0) {
    awards.push({ points: scoreBonus, reason: 'score_performance', description: `Score ${state.score} earned ${scoreBonus} pts` });
  }
 
  // 3. Wisdom decisions bonus
  const wisdomDecisions = state.decisions?.filter(d => d.outcome === 'positive').length ?? 0;
  if (wisdomDecisions > 0) {
    const wisdomPts = Math.min(10, wisdomDecisions * 2);
    awards.push({ points: wisdomPts, reason: 'financial_wisdom', description: `${wisdomDecisions} financially sound decisions` });
  }
 
  // 4. High cooperative quotient bonus
  const coopSignal = signals.find(s => s.type === 'cooperative_quotient');
  if (coopSignal && coopSignal.value >= 70) {
    awards.push({ points: 5, reason: 'cooperative_play', description: 'Strong cooperative decision-making' });
  }
 
  const totalPoints = awards.reduce((sum, a) => sum + a.points, 0);
 
  // Persist awards to ledger
  await db.insert(prestigeLedger).values(
    awards.map(a => ({ memberId, sessionId, points: a.points, reason: a.reason, description: a.description }))
  );
 
  // Update or insert prestige score
  const existing = await db.query.prestigeScores.findFirst({
    where: eq(prestigeScores.memberId, memberId),
  });
 
  if (existing) {
    const newTotal    = existing.totalPoints + totalPoints;
    const newLevel    = Math.floor(newTotal / PRESTIGE_PER_LEVEL) + 1;
    const byGame      = { ...(existing.byGame as Record<string, number>), [gameId]: ((existing.byGame as Record<string, number>)[gameId] ?? 0) + totalPoints };
    const ubuntuBonus = Math.min(MAX_UBUNTU_BONUS, Math.floor(newTotal / 50));
 
    await db.update(prestigeScores).set({
      totalPoints: newTotal,
      level:       newLevel,
      byGame,
      ubuntuBonus,
      lastUpdated: new Date(),
    }).where(eq(prestigeScores.memberId, memberId));
  } else {
    const ubuntuBonus = Math.min(MAX_UBUNTU_BONUS, Math.floor(totalPoints / 50));
    await db.insert(prestigeScores).values({
      memberId,
      totalPoints,
      level:    1,
      byGame:   { [gameId]: totalPoints },
      ubuntuBonus,
    });
  }
 
  return { total: totalPoints, awards };
}
