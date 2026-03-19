'use client';
 
import { useState, useEffect } from 'react';
import { GameCard } from './GameCard';
import { PrestigeTracker } from './PrestigeTracker';
import { Leaderboard } from './Leaderboard';
import type { GameDefinition, PrestigeScore } from '@/lib/games/types';
 
export function GamesDashboard() {
  const [games, setGames] = useState<GameDefinition[]>([]);
  const [prestige, setPrestige] = useState<PrestigeScore | null>(null);
  const [tab, setTab] = useState<'games' | 'leaderboard'>('games');
 
  useEffect(() => {
    fetch('/api/games').then(r => r.json()).then(setGames);
    fetch('/api/games/prestige').then(r => r.json()).then(setPrestige);
  }, []);
 
  return (
    <div className="min-h-screen bg-[#0D1F16] text-white px-6 py-10 font-serif">
 
      {/* Hero */}
      <div className="max-w-5xl mx-auto mb-12">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">🎲</span>
          <h1 className="text-4xl font-bold text-[#C8962B] tracking-tight">
            Financial Intelligence Arcade
          </h1>
        </div>
        <p className="text-[#8A9A8E] text-lg max-w-2xl">
          Play to understand. Understand to prosper. Prosper together.
          Every game teaches real financial concepts and helps Lindiwe build
          a sharper picture of your financial strengths.
        </p>
        <div className="mt-2 h-px bg-[#C8962B] opacity-30 w-48" />
      </div>
 
      {/* Prestige tracker */}
      {prestige && <div className="max-w-5xl mx-auto mb-10"><PrestigeTracker prestige={prestige} /></div>}
 
      {/* Tabs */}
      <div className="max-w-5xl mx-auto mb-8 flex gap-1 bg-[#1B3A2D]/60 rounded-lg p-1 w-fit">
        {(['games', 'leaderboard'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t
                ? 'bg-[#C8962B] text-[#0D1F16]'
                : 'text-[#8A9A8E] hover:text-white'
            }`}
          >
            {t === 'games' ? '🃏 Games' : '🏆 Leaderboard'}
          </button>
        ))}
      </div>
 
      {/* Content */}
      <div className="max-w-5xl mx-auto">
        {tab === 'games' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map(g => <GameCard key={g.id} game={g} />)}
            {games.length === 0 && (
              <div className="col-span-3 text-center text-[#8A9A8E] py-20">Loading games…</div>
            )}
          </div>
        ) : (
          <Leaderboard />
        )}
      </div>
    </div>
  );
}
