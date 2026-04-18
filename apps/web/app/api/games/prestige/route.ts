import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GameService } from '@ubuntu/games';
 
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const prestige = await GameService.getPrestige(userId);
  return NextResponse.json(prestige ?? { totalPoints: 0, level: 1, byGame: {}, ubuntuBonus: 0 });
}
