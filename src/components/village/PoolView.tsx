'use client';

import { motion } from 'framer-motion';

interface YieldCardProps {
  principal: number;
  apy: number;
  daysActive: number;
}

export function YieldCard({ principal, apy, daysActive }: YieldCardProps) {
  const yieldGenerated = (principal * (apy / 100) * (daysActive / 365));
  const projectedAnnual = principal * (apy / 100);
  
  return (
    <div className="up-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="up-kicker">Yield Generation</p>
          <h3 className="mt-1 text-xl font-black tracking-tighter">Compounding Returns</h3>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="px-3 py-1 bg-[color:var(--accent-gold)]/20 text-[color:var(--accent-gold)] text-xs font-black uppercase tracking-widest rounded-full"
        >
          ✨ Active
        </motion.div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 bg-[color:var(--surface-2)] rounded-lg">
          <p className="text-xs text-[color:var(--muted)] mb-1">Principal</p>
          <p className="text-xl font-black">${principal.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-[color:var(--surface-2)] rounded-lg">
          <p className="text-xs text-[color:var(--muted)] mb-1">Yield Generated</p>
          <p className="text-xl font-black text-[color:var(--accent-sage)]">
            +${yieldGenerated.toFixed(2)}
          </p>
        </div>
        <div className="p-4 bg-[color:var(--surface-2)] rounded-lg">
          <p className="text-xs text-[color:var(--muted)] mb-1">APY</p>
          <p className="text-xl font-black text-[color:var(--accent-gold)]">{apy}%</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-[color:var(--muted)]">30-Day Projection</span>
          <span className="font-black text-[color:var(--accent-sage)]">
            +${((principal * (apy / 100)) / 12).toFixed(2)}
          </span>
        </div>
        <div className="h-2 bg-[color:var(--surface-2)] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[color:var(--accent-sage)] to-[color:var(--accent-gold)]"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      <p className="mt-4 text-xs text-[color:var(--muted)]">
        Your safety net generates yield while waiting to be deployed. This is the &ldquo;Holy Grail&rdquo; 
        of social capital — money that works for the community.
      </p>
    </div>
  );
}

interface BufferStatusCardProps {
  currentBuffer: number;
  targetBuffer: number;
  protectionLevel: 'low' | 'medium' | 'high';
}

export function BufferStatusCard({ currentBuffer, targetBuffer, protectionLevel }: BufferStatusCardProps) {
  const percentage = Math.min((currentBuffer / targetBuffer) * 100, 100);
  
  const protectionColors = {
    low: 'var(--accent-clay)',
    medium: 'var(--accent-gold)',
    high: 'var(--accent-sage)',
  };
  
  const protectionLabels = {
    low: 'At Risk',
    medium: 'Building',
    high: 'Protected',
  };

  return (
    <div className="up-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="up-kicker">Safety Net</p>
          <h3 className="mt-1 text-xl font-black tracking-tighter">Buffer Status</h3>
        </div>
        <div 
          className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest"
          style={{ 
            backgroundColor: `${protectionColors[protectionLevel]}20`,
            color: protectionColors[protectionLevel] 
          }}
        >
          {protectionLabels[protectionLevel]}
        </div>
      </div>

      <div className="text-center py-4">
        <p className="text-4xl font-black">${currentBuffer.toLocaleString()}</p>
        <p className="text-sm text-[color:var(--muted)]">
          of ${targetBuffer.toLocaleString()} target
        </p>
      </div>

      <div className="h-3 bg-[color:var(--surface-2)] rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full"
          style={{ backgroundColor: protectionColors[protectionLevel] }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[color:var(--border)]">
        <div className="text-center">
          <p className="text-2xl font-black">{percentage.toFixed(0)}%</p>
          <p className="text-xs text-[color:var(--muted)]">Funded</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black">${(targetBuffer - currentBuffer).toLocaleString()}</p>
          <p className="text-xs text-[color:var(--muted)]">To Goal</p>
        </div>
      </div>
    </div>
  );
}
