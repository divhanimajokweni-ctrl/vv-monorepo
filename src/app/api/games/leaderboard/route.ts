import { NextResponse } from 'next/server';
import { GameService } from '@ubuntu/games';
 
export async function GET() {
  const leaderboard = await GameService.getLeaderboard();
  return NextResponse.json(leaderboard);
}
