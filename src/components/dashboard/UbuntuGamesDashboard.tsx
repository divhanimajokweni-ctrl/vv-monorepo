'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import type { GameDefinition } from '@/lib/games/types';

interface UbuntuGamesDashboardProps {
  compact?: boolean;
}

export function UbuntuGamesDashboard({ compact = false }: UbuntuGamesDashboardProps) {
  const [games, setGames] = useState<GameDefinition[]>([]);
  const [activeTab, setActiveTab] = useState<'play' | 'leaderboard'>('play');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/games')
      .then(r => r.json())
      .then(data => {
        setGames(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const ubuntuGames = games.filter(g => g.id.includes('ubuntu') || g.id === 'the_commons');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[color:var(--surface-2)] rounded-2xl border border-[color:var(--border)] overflow-hidden"
    >
      <div className="p-4 border-b border-[color:var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎮</span>
            <h3 className="font-black text-[color:var(--text)]">Ubuntu Games</h3>
          </div>
          {!compact && (
            <Link
              href="/games"
              className="text-xs font-medium text-[color:var(--accent-sage)] hover:underline"
            >
              View All Games →
            </Link>
          )}
        </div>
      </div>

      <div className="flex gap-1 p-2 bg-[color:var(--surface-1)]">
        {(['play', 'leaderboard'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab
                ? 'bg-[color:var(--accent-sage)] text-white'
                : 'text-[color:var(--muted)] hover:text-[color:var(--text)] hover:bg-[color:var(--surface-2)]'
            }`}
          >
            {tab === 'play' ? '🎲 Play' : '🏆 Rankings'}
          </button>
        ))}
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-center py-8 text-[color:var(--muted)]">
            Loading games...
          </div>
        ) : activeTab === 'play' ? (
          <div className={compact ? 'space-y-3' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
            {ubuntuGames.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] hover:border-[color:var(--accent-gold)] transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                    style={{ backgroundColor: game.color + '20' }}
                  >
                    {game.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-[color:var(--text)] truncate">
                      {game.name}
                    </h4>
                    <p className="text-xs text-[color:var(--muted)] mt-1 line-clamp-2">
                      {game.tagline}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-[color:var(--accent-sage)]/20 text-[color:var(--accent-sage)]">
                        {game.difficulty}
                      </span>
                      <span className="text-xs text-[color:var(--muted)]">
                        {game.estimatedMins} min
                      </span>
                    </div>
                  </div>
                </div>
                <button className="w-full mt-3 py-2 text-xs font-black uppercase bg-[color:var(--accent-gold)] text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  Start Game
                </button>
              </motion.div>
            ))}
            {ubuntuGames.length === 0 && (
              <div className="text-center py-8 text-[color:var(--muted)] col-span-2">
                No Ubuntu games available yet
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {ubuntuGames.slice(0, 5).map((game, index) => (
              <div
                key={game.id}
                className="flex items-center justify-between p-3 rounded-lg bg-[color:var(--surface-1)]"
              >
                <div className="flex items-center gap-3">
                  <span className={`font-bold text-sm ${
                    index === 0 ? 'text-[color:var(--accent-gold)]' : 'text-[color:var(--muted)]'
                  }`}>
                    #{index + 1}
                  </span>
                  <span className="text-lg">{game.icon}</span>
                  <span className="text-sm font-medium text-[color:var(--text)]">
                    {game.name}
                  </span>
                </div>
                <span className="text-xs text-[color:var(--muted)]">
                  {game.concepts.slice(0, 2).join(' · ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}