import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GameService } from '@/lib/services/game-service';
 
/** GET /api/games/lindiwe/fingerprint — get Lindiwe behavioural fingerprint */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const fingerprint = await GameService.getLindiwefingerprint(userId);
  return NextResponse.json(fingerprint);
}
