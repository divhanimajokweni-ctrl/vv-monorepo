import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GameService } from '@/lib/services/game-service';
import type { GameId } from '@/lib/games/types';
 
/** POST /api/games/sessions — start a new game session */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
 
  const { gameId, villageId } = await request.json();
  if (!gameId) return NextResponse.json({ error: 'gameId required' }, { status: 400 });
 
  try {
    const result = await GameService.startGame(userId, gameId as GameId, { villageId });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
 
/** GET /api/games/sessions — list my sessions */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const sessions = await GameService.getMemberSessions(userId);
  return NextResponse.json(sessions);
}
