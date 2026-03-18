'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, TrendingUp, Vote, Activity, Zap } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface PillarData {
  consistency: number;    // 0-100
  reciprocity: number;    // 0-100
  utilization: number;    // 0-100
  governance: number;     // 0-100
}

interface UbuntuDashboardProps {
  score?: number;          // 0-1000
  pillars?: PillarData;
  villagerName?: string;
  villageName?: string;
  villageRank?: string;
  lindiweActive?: boolean;
  villageBoosted?: boolean;  // 95%+ pool health => +5% boost
}

// ── Ubuntu Score Calculation ────────────────────────────────────────────────

export const calculateUbuntuScore = (
  userData: {
    onTimePayments: number;
    totalCycles: number;
    peerAssistanceCount: number;
    avgRepaymentDays: number;
    votesCast: number;
  },
  poolData: {
    totalVotes: number;
    healthRating: number;
  }
): number => {
  const consistency = userData.totalCycles > 0
    ? userData.onTimePayments / userData.totalCycles
    : 0;
  const reciprocity = Math.min(userData.peerAssistanceCount / 10, 1);
  const utilization = Math.max(0, 1 - userData.avgRepaymentDays / 30);
  const governance = poolData.totalVotes > 0
    ? Math.min(userData.votesCast / poolData.totalVotes, 1)
    : 0;

  // Weighted aggregate: 40% + 30% + 20% + 10%
  let rawScore =
    consistency * 400 +
    reciprocity * 300 +
    utilization * 200 +
    governance * 100;

  // Village Multiplier: +5% if pool health > 95%
  if (poolData.healthRating > 0.95) {
    rawScore *= 1.05;
  }

  return Math.min(Math.round(rawScore), 1000);
};

// ── Subcomponents ───────────────────────────────────────────────────────────

const ScoreGauge: React.FC<{ score: number; boosted: boolean }> = ({ score, boosted }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (circumference * animatedScore) / 1000;

  const getColor = (s: number) => {
    if (s > 700) return { stroke: '#10b981', text: 'text-emerald-500', label: 'Excellent' };
    if (s > 400) return { stroke: '#f59e0b', text: 'text-amber-500', label: 'Good' };
    return { stroke: '#ef4444', text: 'text-rose-500', label: 'Building' };
  };

  const color = getColor(score);

  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-4">
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          {/* Track */}
          <circle cx="80" cy="80" r="70" fill="transparent"
            stroke="#f1f5f9" strokeWidth="12" />
          {/* Progress */}
          <circle cx="80" cy="80" r="70" fill="transparent"
            stroke={color.stroke}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`text-5xl font-black ${color.text}`}>{score}</span>
          <span className="text-xs uppercase tracking-widest text-slate-400 font-bold mt-1">
            Ubuntu Score
          </span>
        </div>
      </div>

      <div className="text-center">
        <span className={`text-sm font-bold ${color.text}`}>{color.label}</span>
        {boosted && (
          <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <Zap size={12} />
            <span>Village Boost Active (+5%)</span>
          </div>
        )}
      </div>
    </div>
  );
};

const PillarRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  weight: string;
  colorClass: string;
  description: string;
}> = ({ icon, label, value, weight, colorClass, description }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
    <div className="flex items-center gap-3 mb-3">
      <div className={`p-2 rounded-lg ${colorClass} text-white flex-shrink-0`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-slate-800">{label}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">{weight}</span>
            <span className="text-sm font-bold text-slate-700">{value}%</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-0.5 truncate">{description}</p>
      </div>
    </div>
    <div className="w-full bg-slate-100 rounded-full h-2.5">
      <div
        className={`${colorClass} h-2.5 rounded-full transition-all duration-700 ease-out`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

const StatCard: React.FC<{ label: string; value: string; subtext?: string }> = ({
  label, value, subtext
}) => (
  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
    <p className="text-xl font-black text-slate-800 mt-1">{value}</p>
    {subtext && <p className="text-xs text-slate-500 mt-0.5">{subtext}</p>}
  </div>
);

// ── Main Dashboard ──────────────────────────────────────────────────────────

const UbuntuDashboard: React.FC<UbuntuDashboardProps> = ({
  score = 750,
  pillars = { consistency: 85, reciprocity: 70, utilization: 90, governance: 40 },
  villagerName = 'Villager',
  villageName = 'Khayelitsha Pool 01',
  villageRank = 'Top 12%',
  lindiweActive = true,
  villageBoosted = false,
}) => {
  return (
    <div className="p-6 max-w-4xl mx-auto bg-slate-50 min-h-screen rounded-3xl">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Ubuntu Dashboard</h1>
          <p className="text-slate-500 italic text-sm mt-0.5">
            "I am because we are." — Welcome, {villagerName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lindiweActive && (
            <div className="px-3 py-1.5 bg-white rounded-full border border-emerald-200 shadow-sm flex items-center gap-2">
              <Activity size={14} className="text-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-700">Lindiwe Active</span>
            </div>
          )}
        </div>
      </header>

      {/* Village Info Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <Users size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Your Village</p>
            <p className="text-sm font-bold text-slate-800">{villageName}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Your Rank</p>
          <p className="text-sm font-bold text-emerald-600">{villageRank}</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Score Gauge */}
        <ScoreGauge score={score} boosted={villageBoosted} />

        {/* Pillars */}
        <div className="md:col-span-2 space-y-3">
          <PillarRow
            icon={<ShieldCheck size={18} />}
            label="Consistency"
            value={pillars.consistency}
            weight="40%"
            colorClass="bg-blue-500"
            description="On-time contributions to the Village Pool"
          />
          <PillarRow
            icon={<Users size={18} />}
            label="Reciprocity"
            value={pillars.reciprocity}
            weight="30%"
            colorClass="bg-purple-500"
            description="Peer-to-peer support within the Village"
          />
          <PillarRow
            icon={<TrendingUp size={18} />}
            label="Utilization"
            value={pillars.utilization}
            weight="20%"
            colorClass="bg-emerald-500"
            description="Responsible use of pool liquidity"
          />
          <PillarRow
            icon={<Vote size={18} />}
            label="Governance"
            value={pillars.governance}
            weight="10%"
            colorClass="bg-orange-500"
            description="Pool voting & Lindiwe AI feedback loops"
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Score Range" value="0 – 1000" subtext="No cap on growth" />
        <StatCard label="Leakage Policy" value="Active" subtext="No penalty for low balance" />
        <StatCard label="Village Boost" value={villageBoosted ? "+5%" : "Inactive"}
          subtext="Requires 95%+ pool health" />
      </div>

      {/* Lindiwe Footer */}
      {lindiweActive && (
        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <Activity size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Lindiwe says:</p>
            <p className="text-sm text-slate-600 mt-0.5 italic">
              "{score > 700
                ? 'The village is proud of your contribution. Your lending rate has been adjusted in your favour.'
                : score > 400
                  ? 'You are building trust with the village. Keep contributing consistently.'
                  : 'Every contribution counts. The village is here to support you as you grow.'
              }"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UbuntuDashboard;
