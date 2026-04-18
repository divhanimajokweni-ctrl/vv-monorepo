'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VillagePulse {
  overall: number;
  anxiety: number;
  excitement: number;
  stability: number;
}

interface BackboneState {
  currentMode: 'prosperity' | 'expansion' | 'stability' | 'shield' | 'emergency';
  entryThreshold: number;
  safetyBuffer: {
    currentBalance: number;
    targetBalance: number;
    healthRatio: number;
  };
  villagePulse: VillagePulse;
  lastRegulation: string;
}

interface VillageStatusProps {
  compact?: boolean;
}

function LindiweAvatar({ status }: { status: 'happy' | 'protective' | 'neutral' | 'alert' }) {
  const colors = {
    happy: 'from-emerald-400 to-teal-500',
    protective: 'from-sky-400 to-blue-500',
    neutral: 'from-amber-400 to-orange-500',
    alert: 'from-red-400 to-rose-500',
  };

  const icons = {
    happy: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
    protective: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
      </svg>
    ),
    neutral: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
      </svg>
    ),
    alert: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
      </svg>
    ),
  };

  return (
    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${colors[status]} flex items-center justify-center shadow-lg`}>
      <div className="text-white">
        {icons[status]}
      </div>
    </div>
  );
}

function MetricCard({ label, value, status, subValue }: { label: string; value: string | number; status: 'safe' | 'warning' | 'danger'; subValue?: string }) {
  const statusStyles = {
    safe: 'bg-emerald-900/50 border-emerald-700 text-emerald-100',
    warning: 'bg-amber-900/50 border-amber-700 text-amber-100',
    danger: 'bg-red-900/50 border-red-700 text-red-100',
  };

  const valueStyles = {
    safe: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-red-400',
  };

  return (
    <div className={`p-4 rounded-xl border ${statusStyles[status]}`}>
      <p className="text-xs uppercase tracking-wider opacity-70 mb-1">{label}</p>
      <p className={`text-2xl font-black ${valueStyles[status]}`}>{value}</p>
      {subValue && <p className="text-xs mt-1 opacity-70">{subValue}</p>}
    </div>
  );
}

function ProsperityStatus({ state, compact = false }: { state: BackboneState; compact?: boolean }) {
  const pulseLabel = state.villagePulse.overall > 0.7 ? 'Thriving' : state.villagePulse.overall > 0.5 ? 'Growing' : 'Steady';

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-emerald-900/80 to-teal-900/80 border border-emerald-500/50 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-emerald-300 uppercase font-bold">Prosperity</p>
            <p className="text-sm font-black text-white">R {state.safetyBuffer.currentBalance.toLocaleString()}</p>
          </div>
        </div>
        <span className="text-emerald-400 text-xs font-medium">Threshold: {state.entryThreshold}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-emerald-950 to-teal-950 border-2 border-emerald-500 rounded-3xl p-6 shadow-xl shadow-emerald-900/20"
    >
      <header className="flex items-center gap-4 mb-5 pb-5 border-b border-emerald-800/50">
        <LindiweAvatar status="happy" />
        <div>
          <h2 className="text-sm uppercase font-bold text-emerald-300 tracking-widest">Active State</h2>
          <p className="text-3xl font-black text-white tracking-tight">PROSPERITY MODE</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <MetricCard
          label="Safety Buffer"
          value={`R ${state.safetyBuffer.currentBalance.toLocaleString()}`}
          status="safe"
          subValue={`Target: R ${state.safetyBuffer.targetBalance.toLocaleString()}`}
        />
        <MetricCard
          label="Village Pulse"
          value={pulseLabel}
          status="safe"
          subValue={`${Math.round(state.villagePulse.overall * 100)}%`}
        />
      </div>

      <div className="bg-emerald-900/60 rounded-xl p-4 border border-emerald-700/50">
        <h4 className="font-bold text-emerald-200 flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          Lindiwe&apos;s Reasoning:
        </h4>
        <p className="text-white text-sm mt-2 leading-relaxed">
          &quot;The Village Vault is overflowing with abundance. I have lowered the entry barriers by {Math.abs(state.entryThreshold - 650)} points. 
          This is the season to invite new seekers to the Matchmaker. Collective prosperity awaits!&quot;
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-emerald-400/70">
        <span>Entry Threshold: {state.entryThreshold}</span>
        <span>Last Update: {new Date(state.lastRegulation).toLocaleTimeString()}</span>
      </div>
    </motion.div>
  );
}

function ShieldStatus({ state, compact = false }: { state: BackboneState; compact?: boolean }) {
  const pulseLabel = state.villagePulse.anxiety > 0.5 ? 'Anxious' : state.villagePulse.anxiety > 0.3 ? 'Cautious' : 'Stable';

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-sky-900/80 to-blue-900/80 border border-sky-500/50 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-sky-300 uppercase font-bold">Shield Active</p>
            <p className="text-sm font-black text-white">R {state.safetyBuffer.currentBalance.toLocaleString()}</p>
          </div>
        </div>
        <span className="text-sky-400 text-xs font-medium">Threshold: {state.entryThreshold}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-sky-950 to-blue-950 border-2 border-sky-500 rounded-3xl p-6 shadow-xl shadow-sky-900/20"
    >
      <header className="flex items-center gap-4 mb-5 pb-5 border-b border-sky-800/50">
        <LindiweAvatar status="protective" />
        <div>
          <h2 className="text-sm uppercase font-bold text-sky-300 tracking-widest">Active State</h2>
          <p className="text-3xl font-black text-white tracking-tight">SHIELD MODE</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <MetricCard
          label="Safety Buffer"
          value={`R ${state.safetyBuffer.currentBalance.toLocaleString()}`}
          status={state.safetyBuffer.healthRatio < 0.25 ? 'danger' : 'warning'}
          subValue={`${Math.round(state.safetyBuffer.healthRatio * 100)}% of target`}
        />
        <MetricCard
          label="Village Pulse"
          value={pulseLabel}
          status={state.villagePulse.anxiety > 0.5 ? 'danger' : 'warning'}
          subValue={`Anxiety: ${Math.round(state.villagePulse.anxiety * 100)}%`}
        />
      </div>

      <div className="bg-sky-900/60 rounded-xl p-4 border border-sky-700/50">
        <h4 className="font-bold text-sky-200 flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
          </svg>
          Lindiwe&apos;s Reasoning:
        </h4>
        <p className="text-white text-sm mt-2 leading-relaxed">
          &quot;I have detected external volatility in the collective. I have activated Shield Mode to protect the existing pools. 
          New pool formation now requires a Village Elder status (Ubuntu Score {'>'} {state.entryThreshold}). 
          Together we will weather this storm.&quot;
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-sky-400/70">
        <span>Entry Threshold: {state.entryThreshold}</span>
        <span>Last Update: {new Date(state.lastRegulation).toLocaleTimeString()}</span>
      </div>
    </motion.div>
  );
}

function EmergencyStatus({ state, compact = false }: { state: BackboneState; compact?: boolean }) {
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-red-900/80 to-rose-900/80 border border-red-500/50 rounded-xl p-3 flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-red-300 uppercase font-bold">Emergency</p>
            <p className="text-sm font-black text-white">R {state.safetyBuffer.currentBalance.toLocaleString()}</p>
          </div>
        </div>
        <span className="text-red-400 text-xs font-medium">LOCKED</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-red-950 to-rose-950 border-2 border-red-500 rounded-3xl p-6 shadow-xl shadow-red-900/20 animate-pulse"
    >
      <header className="flex items-center gap-4 mb-5 pb-5 border-b border-red-800/50">
        <LindiweAvatar status="alert" />
        <div>
          <h2 className="text-sm uppercase font-bold text-red-300 tracking-widest">Emergency State</h2>
          <p className="text-3xl font-black text-white tracking-tight">EMERGENCY LOCK</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <MetricCard
          label="Safety Buffer"
          value={`R ${state.safetyBuffer.currentBalance.toLocaleString()}`}
          status="danger"
          subValue="CRITICAL LEVEL"
        />
        <MetricCard
          label="Village Pulse"
          value="Crisis"
          status="danger"
          subValue={`Anxiety: ${Math.round(state.villagePulse.anxiety * 100)}%`}
        />
      </div>

      <div className="bg-red-900/60 rounded-xl p-4 border border-red-700/50">
        <h4 className="font-bold text-red-200 flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
          Lindiwe&apos;s Reasoning:
        </h4>
        <p className="text-white text-sm mt-2 leading-relaxed">
          &quot;CRITICAL: The Safety Buffer has fallen below the critical threshold. I have locked all pool formations 
          and only Village Elders (Ubuntu Score {'>'} {state.entryThreshold}) may participate. 
          We must rebuild our collective strength before resuming normal operations.&quot;
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-red-400/70">
        <span>Entry Threshold: {state.entryThreshold}</span>
        <span>Emergency Lock Active</span>
      </div>
    </motion.div>
  );
}

export function VillageStatus({ compact = false }: VillageStatusProps) {
  const [state, setState] = useState<BackboneState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchState() {
      try {
        const res = await fetch('/api/backbone?action=state');
        if (res.ok) {
          const data = await res.json();
          setState(data);
        }
      } catch (error) {
        console.error('Failed to fetch backbone state:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchState();
    const interval = setInterval(fetchState, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse bg-neutral-800/50 rounded-2xl h-32 flex items-center justify-center">
        <div className="text-neutral-400">Loading Village Status...</div>
      </div>
    );
  }

  if (!state) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {state.currentMode === 'emergency' || state.currentMode === 'shield' ? (
        <ShieldStatus key="shield" state={state} compact={compact} />
      ) : state.currentMode === 'prosperity' ? (
        <ProsperityStatus key="prosperity" state={state} compact={compact} />
      ) : (
        <ShieldStatus key="stability" state={state} compact={compact} />
      )}
    </AnimatePresence>
  );
}

export function VillageStatusCompact() {
  return <VillageStatus compact />;
}
