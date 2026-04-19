/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Brain, Zap, Shield, Coins, Wheat, Users, X, Sun, Moon } from 'lucide-react';
import { Game, GameSignal, LindiweResult } from './types';
import { useLocalPersistence, useSignalQueue } from './persistence';

const GameModal = React.lazy(() => import('./GameModal'));

const GAMES: Game[] = [
  {
    id: 'lottery',
    name: 'LOTTERY: POOL DEFENSE',
    icon: '🎰',
    description: 'High stakes gambling. Can you rely on your community pool if you crash?',
    timebox: 60,
  },
  {
    id: 'crop',
    name: 'CROP: GLOBAL SHOCKS',
    icon: '🌾',
    description: 'Agriculture vs Market Volatility. Hedge your grain or face the wipeout.',
    timebox: 90,
  },
  {
    id: 'fi',
    name: 'STOKVEL STRATEGY (FI)',
    icon: '🤝',
    description: 'Manage a collective pool. Handle defaults, liquidity, and trust.',
    timebox: 120,
  },
];

export default function UbuntuPoolsApp() {
  const { saveState, loadState } = useLocalPersistence();
  const { queueSignal } = useSignalQueue();

  // Initialize state from localStorage
  const savedState = loadState();
  const [prestige, setPrestige] = useState(savedState?.prestige ?? 150);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [lindiweStats, setLindiweStats] = useState(savedState?.lindiweStats ?? { impulse: 0.5, altruism: 0 });
  const [leaderboard, setLeaderboard] = useState(savedState?.leaderboard ?? [
    { name: 'Sovereign_Alpha', wealth: 12500, prestige: 4500 },
    { name: 'Ubuntu_Queen', wealth: 9800, prestige: 5200 },
    { name: 'Lindiwe_Watcher', wealth: 7500, prestige: 3800 },
  ]);

  // Save state whenever it changes
  useEffect(() => {
    saveState({
      prestige,
      lindiweStats,
      leaderboard,
      gameHistory: [] // Could be expanded
    });
  }, [prestige, lindiweStats, leaderboard, saveState]);

  useEffect(() => {
    document.documentElement.classList.toggle('light', !isDarkMode);
  }, [isDarkMode]);

  const ingestSignal = useCallback((signal: GameSignal) => {
    const calcImpulse = (s: GameSignal) => {
      let i = 0.5;
      if (s.decisionTime < 1500) i += 0.3;
      if (s.risk === 'extreme') i += 0.2;
      return Math.min(1, i);
    };

    const impulse = calcImpulse(signal);
    const altruism = signal.metadata?.isAltruistic ? 0.4 : 0;

    const prestigeGain = (signal.score / 1000) + (altruism * 50);
    setPrestige(prev => prev + Math.max(0, prestigeGain));
    setLindiweStats({ impulse, altruism });

    return { impulse, altruism };
  }, []);

  const handleGameEnd = (score: number, meta: any) => {
    const signal = {
      score,
      decisionTime: meta.decisionTime || 2000,
      risk: meta.risk || 'medium',
      metadata: meta,
    };

    ingestSignal(signal);
    queueSignal(signal); // Queue for sync when backend available
    setActiveGameId(null);
  };

  return (
    <div className="container mx-auto px-8 py-10 max-w-6xl">
      <header className="text-center mb-10 border-b border-cyber-cyan pb-6 relative">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="absolute right-0 top-0 p-2 rounded-lg border border-cyber-cyan/30 hover:border-cyber-cyan transition-all"
          title={isDarkMode ? "Switch to Day Mode" : "Switch to Night Mode"}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <div className="flex justify-between items-end mb-4">
          <motion.h1
            className="text-4xl font-bold animate-glitch tracking-[5px] uppercase"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Ubuntu Pools V2.0
          </motion.h1>
          <div className="text-right">
            <div className="text-[0.65rem] text-cyber-cyan/70 uppercase mb-1">SOVEREIGN STATUS</div>
            <div className="text-2xl font-bold text-cyber-pink">
              PRESTIGE: {Math.floor(prestige).toLocaleString()} XP
            </div>
          </div>
        </div>

        <div className="w-full h-2 bg-gray-900 border border-cyber-pink rounded-full overflow-hidden relative">
          <motion.div
            className="h-full bg-gradient-to-r from-cyber-pink to-cyber-cyan prestige-glow"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (prestige / 5000) * 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="mt-6 bg-cyber-pink/5 border border-dashed border-cyber-pink px-4 py-2 inline-block">
          <div className="flex items-center gap-3 text-[0.8rem] text-white">
            <span className="w-2 h-2 bg-cyber-cyan rounded-full pulse-dot" />
            <span>
              LINDIWE: TRACKING ALTRUISM INDEX [{lindiweStats.altruism.toFixed(2)}] — IMPULSE STABILITY: {lindiweStats.impulse < 0.7 ? 'NOMINAL' : 'VOLATILE'}
            </span>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
        {GAMES.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onPlay={() => setActiveGameId(game.id)}
          />
        ))}
      </main>

      <footer className="mt-12 border-top border-gray-800 pt-8">
        <div className="text-[0.75rem] uppercase tracking-[2px] text-cyber-pink mb-4">
          {/* Top Sovereigns (Altruism + Wealth) */}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {leaderboard.map((entry, i) => (
            <div key={i} className="bg-white/5 p-3 border-l-2 border-cyber-cyan">
              <span className="block text-[0.65rem] text-cyber-cyan/70 mb-1">
                {String(i + 1).padStart(2, '0')}. {entry.name.toUpperCase()}
              </span>
              <span className="font-bold text-sm">
                A: {((entry.prestige / 5000) * 100).toFixed(0)}% | R{entry.wealth.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </footer>

      <AnimatePresence>
        {activeGameId && (
          <Suspense fallback={
            <motion.div
              className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-white text-xl">Loading Game...</div>
            </motion.div>
          }>
            <GameModal
              game={GAMES.find(g => g.id === activeGameId)!}
              onClose={() => setActiveGameId(null)}
              onEnd={handleGameEnd}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
}

interface GameCardProps {
  game: Game;
  onPlay: () => void;
  key?: string | number;
}

function GameCard({ game, onPlay }: GameCardProps) {
  return (
    <motion.div
      className="bg-cyber-accent/80 border border-cyber-cyan rounded p-6 flex flex-col transition-all duration-200 card-inset-glow hover:border-cyber-pink group"
      whileHover={{ y: -2 }}
    >
      <div className="text-4xl mb-4 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{game.icon}</div>
      <h3 className="text-lg font-bold mb-2 text-white tracking-wider uppercase">{game.name}</h3>
      <p className="text-cyber-cyan/70 text-[0.85rem] leading-relaxed flex-grow">{game.description}</p>
      <button
        onClick={onPlay}
        className="mt-5 border border-cyber-cyan bg-transparent text-cyber-cyan py-2.5 font-bold uppercase tracking-wider text-xs hover:bg-cyber-cyan hover:text-black transition-colors"
      >
        Initiate Sequence
      </button>
    </motion.div>
  );
}
export default function UbuntuPoolsApp() {
  return null;
}
