import { NextResponse } from 'next/server';
import { GameService } from '@/lib/services/game-service';
 
export async function GET() {
  const leaderboard = await GameService.getLeaderboard();
  return NextResponse.json(leaderboard);
}
