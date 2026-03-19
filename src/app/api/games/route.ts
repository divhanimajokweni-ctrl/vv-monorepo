import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GameService } from '@/lib/services/game-service';
 
/** GET /api/games — list all game definitions */
export async function GET() {
  return NextResponse.json(GameService.getDefinitions());
}
