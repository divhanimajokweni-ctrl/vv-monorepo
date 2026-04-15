/**
 * Individual Game Page
 */
import { GameEngine } from '@/components/games/GameEngine';
import type { GameId } from '@/lib/games/types';
 
export default async function GamePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  return <GameEngine gameId={gameId as GameId} />;
}
