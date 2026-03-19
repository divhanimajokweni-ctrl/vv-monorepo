import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GameService } from '@/lib/services/game-service';
 
/** POST /api/games/sessions/[sessionId]/action — submit a game action */
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
 
  const body = await request.json();
  if (!body.type) return NextResponse.json({ error: 'action.type required' }, { status: 400 });
 
  try {
    const result = await GameService.submitAction(params.sessionId, userId, body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
