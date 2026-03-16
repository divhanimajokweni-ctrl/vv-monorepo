'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CommonsVaultProps {
  currentAmount: number;
  maxAmount: number;
  unlocksAt?: number;
  contributors?: number;
}

export function CommonsVault({ 
  currentAmount, 
  maxAmount, 
  unlocksAt = 0,
  contributors = 0 
}: CommonsVaultProps) {
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);
  
  const percentage = Math.min((currentAmount / maxAmount) * 100, 100);
  const isUnlocked = percentage >= 100;
  
  const unlocksIn = unlocksAt > 0 
    ? Math.max(0, Math.ceil((unlocksAt - currentTime) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-earth to-harvest flex items-center justify-center">
            <span className="text-2xl">🏛️</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Commons Vault</h3>
            <p className="text-sm text-neutral-400">Shared community resources</p>
          </div>
        </div>
        
        {isUnlocked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-3 py-1 bg-harvest/20 text-harvest rounded-full text-sm font-medium"
          >
            ✨ Unlocked
          </motion.div>
        )}
      </div>

      <div className="commons-vault-bar mb-3">
        <motion.div
          className="commons-vault-progress"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>

      <div className="flex items-center justify-between text-sm mb-4">
        <div>
          <span className="text-neutral-400">Progress:</span>{' '}
          <span className="text-white font-semibold">{currentAmount.toLocaleString()}</span>
          <span className="text-neutral-500"> / {maxAmount.toLocaleString()}</span>
        </div>
        <div className="text-harvest font-bold italic">
          {percentage.toFixed(1)}%
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-800">
        <div className="text-center">
          <div className="text-2xl font-bold text-earth">{contributors}</div>
          <div className="text-xs text-neutral-400">Contributors</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-harvest">
            {isUnlocked ? '∞' : unlocksIn ? `${unlocksIn}d` : '—'}
          </div>
          <div className="text-xs text-neutral-400">
            {isUnlocked ? 'Unlocked' : unlocksIn ? 'Until unlock' : 'Status'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-clay">
            {isUnlocked ? 'ACTIVE' : 'LOCKED'}
          </div>
          <div className="text-xs text-neutral-400">Vault Status</div>
        </div>
      </div>

      {!isUnlocked && (
        <div className="mt-4 p-3 bg-neutral-800/50 rounded-lg">
          <div className="text-xs text-neutral-400 mb-1">Next unlock rewards:</div>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 bg-neutral-700 rounded">API Credits +50</span>
            <span className="px-2 py-1 bg-neutral-700 rounded">Boost x1</span>
          </div>
        </div>
      )}
    </div>
  );
}
