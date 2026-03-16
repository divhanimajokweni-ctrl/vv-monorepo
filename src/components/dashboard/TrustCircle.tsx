'use client';

import { useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';

interface TrustCircleProps {
  members?: number;
  total?: number;
}

function getThemeSnapshot(): boolean {
  if (typeof window === 'undefined') return true;
  return document.documentElement.getAttribute('data-theme') !== 'light';
}

const emptySubscribe = () => () => {};

export function TrustCircle({ members = 24, total = 50 }: TrustCircleProps) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (members / total) * circumference;
  
  const isDark = useSyncExternalStore(emptySubscribe, getThemeSnapshot, () => true);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative">
        <svg 
          className="w-24 h-24 transform -rotate-90" 
          viewBox="0 0 96 96"
        >
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            className="stroke-current text-[color:var(--border)]"
            strokeWidth="8"
          />
          <motion.circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            className="stroke-current transition-all duration-1000 ease-out"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              stroke: isDark ? 'var(--accent-ubuntu)' : '#059669',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-black text-[color:var(--text)]">{members}</span>
        </div>
      </div>
      <span className="mt-3 text-xs font-bold uppercase tracking-widest text-[color:var(--muted)]">
        Trust Circle
      </span>
    </div>
  );
}
