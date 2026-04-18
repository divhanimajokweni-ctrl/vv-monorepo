// pages/api/leaderboards/[gameId].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@ubuntu/db/client';
import { gameSessions } from '@ubuntu/db/schema-games';
import { eq, gte, desc, and } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { gameId } = req.query;
  const { timeframe = 'weekly', limit = 100 } = req.query;

  try {
    const scores = await db
      .select({
        memberId: gameSessions.memberId,
        finalScore: gameSessions.finalScore,
        completedAt: gameSessions.completedAt,
      })
      .from(gameSessions)
      .where(and(
        eq(gameSessions.gameId, gameId as any),
        gte(gameSessions.completedAt, getTimeframeDate(timeframe as string))
      ))
      .orderBy(desc(gameSessions.finalScore))
      .limit(Number(limit));

    res.status(200).json(scores);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

function getTimeframeDate(timeframe: string): Date {
  const now = new Date();
  switch (timeframe) {
    case 'weekly':
      now.setDate(now.getDate() - 7);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() - 1);
      break;
    default:
      now.setDate(now.getDate() - 7);
  }
  return now;
}