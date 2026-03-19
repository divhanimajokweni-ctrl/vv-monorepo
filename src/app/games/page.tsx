/**
 * Ubuntu Pools — Games Dashboard Page
 * Displays the Financial Intelligence Arcade.
 */
import { GamesDashboard } from '@/components/games/GamesDashboard';
import type { Metadata } from 'next';
 
export const metadata: Metadata = {
  title: 'Ubuntu Pools | Games Dashboard',
  description: 'Play to understand. Understand to prosper. Prosper together.',
};
 
export default function GamesPage() {
  return <GamesDashboard />;
}
