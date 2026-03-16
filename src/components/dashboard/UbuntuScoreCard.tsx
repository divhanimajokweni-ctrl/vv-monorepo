'use client';

import { useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';

interface UbuntuScoreCardProps {
  score?: number;
  change?: number;
}

function getThemeSnapshot(): boolean {
  if (typeof window === 'undefined') return true;
  return document.documentElement.getAttribute('data-theme') !== 'light';
}

const emptySubscribe = () => () => {};

export function UbuntuScoreCard({ score = 847, change = 12 }: UbuntuScoreCardProps) {
  const isDark = useSyncExternalStore(emptySubscribe, getThemeSnapshot, () => true);

  return (
    <motion.div
      className={`
        relative overflow-hidden rounded-2xl p-6 transition-all duration-500
        bg-[color:var(--surface-2)] border border-[color:var(--border)]
        ${isDark 
          ? 'hover:shadow-[0_0_40px_rgba(251,191,36,0.15)]' 
          : 'hover:shadow-[inset_0_2px_8px_rgba(0,0,0,0.08)]'
        }
        hover:scale-[1.01]
        will-change-transform
        transform-gpu
      `}
      style={{
        boxShadow: isDark 
          ? '0 0 20px rgba(251,191,36,0.1)' 
          : 'inset 0 1px 3px rgba(0,0,0,0.06)',
      }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-[color:var(--muted)]">Ubuntu Score</h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-black tracking-tighter text-[color:var(--text)]">
              {score}
            </span>
            <motion.span 
              className="text-sm font-bold"
              style={{ color: isDark ? '#34d399' : '#059669' }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              key={change}
            >
              +{change}
            </motion.span>
          </div>
        </div>
        <div 
          className="p-2 rounded-full"
          style={{ backgroundColor: isDark ? 'rgba(251,191,36,0.1)' : 'rgba(180,83,9,0.1)' }}
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke={isDark ? '#fbbf24' : '#b45309'}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
            />
          </svg>
        </div>
      </div>
      
      <motion.div 
        className="mt-4 h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
      >
        <motion.div 
          className="h-full rounded-full"
          style={{ 
            background: isDark 
              ? 'linear-gradient(90deg, #34d399, #10b981)' 
              : 'linear-gradient(90deg, #059669, #047857)'
          }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </motion.div>

      <p className="mt-4 text-xs italic text-[color:var(--muted)]">
        &ldquo;I am because we are&rdquo; &mdash; Your digital Ubuntu journey continues
      </p>

      <a 
        href="/faq#ubuntu-score"
        className="absolute top-2 right-2 p-2 rounded-lg opacity-40 hover:opacity-70 transition-opacity"
        aria-label="Get help with Ubuntu Score"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </a>
    </motion.div>
  );
}
