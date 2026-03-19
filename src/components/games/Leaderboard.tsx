'use client';
 
import { useState, useEffect } from 'react';
import type { LeaderboardEntry } from '@/lib/games/types';
 
export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
 
  useEffect(() => {
    fetch('/api/games/leaderboard').then(r => r.json()).then(setEntries);
  }, []);
 
  return (
    <div className="rounded-xl border border-[#2E6B4A]/40 bg-[#1B3A2D]/60 overflow-hidden">
      <div className="px-6 py-4 border-b border-[#2E6B4A]/40">
        <h2 className="text-[#C8962B] font-bold text-lg">🏆 Prestige Leaderboard</h2>
        <p className="text-[#8A9A8E] text-sm">Earned through wisdom, not luck</p>
      </div>
      <div className="divide-y divide-[#2E6B4A]/20">
        {entries.map((e) => (
          <div key={e.memberId} className="px-6 py-4 flex items-center gap-4 hover:bg-[#2E6B4A]/10 transition-colors">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
              ${e.rank === 1 ? 'bg-[#C8962B] text-[#0D1F16]' : e.rank === 2 ? 'bg-[#8A9A8E] text-white' : e.rank === 3 ? 'bg-[#8B3A2A] text-white' : 'bg-[#1B3A2D] text-[#8A9A8E]'}`}>
              {e.rank}
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">{e.displayName}</p>
              <p className="text-[#8A9A8E] text-xs">{e.gamesPlayed} games played</p>
            </div>
            <div className="text-right">
              <p className="text-[#C8962B] font-bold">{e.prestige} pts</p>
              <p className="text-[#8A9A8E] text-xs">Level {e.level}</p>
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="px-6 py-12 text-center text-[#8A9A8E]">No players yet — be the first!</div>
        )}
      </div>
    </div>
  );
}
