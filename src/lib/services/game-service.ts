/**
 * Ubuntu Pools — Game Service
 * High-level business logic used by API routes.
 */
import { db } from '@/db/client';
import { gameSessions, prestigeScores, gameTelemetry } from '@/db/schema-games';
import { eq, desc, and } from 'drizzle-orm';
import { startSession, submitAction } from '@/lib/games/engine';
import { buildFingerprint } from '@/lib/games/telemetry';
import { GAME_DEFINITIONS } from '@/lib/games/registry';
import type { GameId, LeaderboardEntry } from '@/lib/games/types';
 
export class GameService {
 
  static getDefinitions() {
    return Object.values(GAME_DEFINITIONS);
  }
 
  static async startGame(memberId: string, gameId: GameId, opts: { villageId?: string } = {}) {
    return startSession(memberId, gameId, opts);
  }
 
  static async submitAction(sessionId: string, memberId: string, action: { type: string; payload: Record<string, unknown> }) {
    return submitAction(sessionId, memberId, action);
  }
 
  static async getMemberSessions(memberId: string, limit = 20) {
    return db.query.gameSessions.findMany({
      where: eq(gameSessions.memberId, memberId),
      orderBy: [desc(gameSessions.createdAt)],
      limit,
    });
  }
 
  static async getPrestige(memberId: string) {
    return db.query.prestigeScores.findFirst({
      where: eq(prestigeScores.memberId, memberId),
    });
  }
 
  static async getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
    const scores = await db.query.prestigeScores.findMany({
      orderBy: [desc(prestigeScores.totalPoints)],
      limit,
    });
 
    return scores.map((s, i) => ({
      rank:        i + 1,
      memberId:    s.memberId,
      displayName: `Member ${s.memberId.slice(-6)}`,
      prestige:    s.totalPoints,
      level:       s.level,
      gamesPlayed: Object.values(s.byGame as Record<string, number>).reduce((a, b) => a + (b > 0 ? 1 : 0), 0),
    }));
  }
 
  static async getLindiwefingerprint(memberId: string) {
    return buildFingerprint(memberId);
  }
 
  static async grantTelemetryConsent(memberId: string, sessionId: string) {
    await db.update(gameTelemetry)
      .set({ consentGiven: true })
      .where(and(eq(gameTelemetry.memberId, memberId), eq(gameTelemetry.sessionId, sessionId)));
  }
}
