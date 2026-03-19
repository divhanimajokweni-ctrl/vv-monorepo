/**
 * Individual Game Page
 */
import { GameEngine } from '@/components/games/GameEngine';
import type { GameId } from '@/lib/games/types';
 
export default function GamePage({ params }: { params: { gameId: string } }) {
  return <GameEngine gameId={params.gameId as GameId} />;
}
