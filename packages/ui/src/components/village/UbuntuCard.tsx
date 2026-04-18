'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export interface MemberCoreData {
  displayName: string;
  ubuntuScore: number;
  scoreChange: number;
  memberSince: string;
  contributionTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  socialInterests?: string[];
}

export interface VillagePulseData {
  peerMatches: number;
  sharedInterests: string[];
  recentActivity: {
    type: 'contribution' | 'badge' | 'governance' | 'pool';
    description: string;
    timestamp: Date;
  }[];
}

export interface PoolHealthData {
  score: number;
  safetyBuffer: number;
  targetBuffer: number;
  liquidity: number;
  status: 'thriving' | 'stable' | 'stressed' | 'critical';
  compoundingValue?: number;
}

interface UbuntuCardProps {
  memberCore: MemberCoreData;
  villagePulse?: VillagePulseData;
  poolHealth: PoolHealthData;
}

function HealthGaugeSVG({ score, status }: { score: number; status: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  const getColor = () => {
    switch (status) {
      case 'thriving': return '#34d399';
      case 'stable': return '#60a5fa';
      case 'stressed': return '#fbbf24';
      default: return '#f87171';
    }
  };

  const color = getColor();

  return (
    <svg width="90" height="90" viewBox="0 0 90 90" className="transform -rotate-90">
      <circle
        cx="45"
        cy="45"
        r={radius}
        fill="none"
        stroke="#1e293b"
        strokeWidth="6"
      />
      <motion.circle
        cx="45"
        cy="45"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      <text x="45" y="50" textAnchor="middle" fill={color} className="text-xl font-black">
        {score}%
      </text>
    </svg>
  );
}

export function UbuntuCard({ memberCore, villagePulse, poolHealth }: UbuntuCardProps) {
  const [isLoadingPulse, setIsLoadingPulse] = useState(true);
  const [pulseData, setPulseData] = useState<VillagePulseData | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (villagePulse) {
      const timer = setTimeout(() => {
        setPulseData(villagePulse);
        setIsLoadingPulse(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [villagePulse]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'from-slate-300 to-slate-500 border-slate-400';
      case 'gold': return 'from-amber-300 to-amber-500 border-amber-400';
      case 'silver': return 'from-slate-300 to-slate-400 border-slate-400';
      default: return 'from-orange-400 to-orange-600 border-orange-500';
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'thriving': return 'text-emerald-400';
      case 'stable': return 'text-blue-400';
      case 'stressed': return 'text-amber-400';
      default: return 'text-red-400';
    }
  };

  const getHealthBg = (status: string) => {
    switch (status) {
      case 'thriving': return 'bg-emerald-500/10 border-emerald-500/30';
      case 'stable': return 'bg-blue-500/10 border-blue-500/30';
      case 'stressed': return 'bg-amber-500/10 border-amber-500/30';
      default: return 'bg-red-500/10 border-red-500/30';
    }
  };

  const interestColors: Record<string, string> = {
    'ESG': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    'Tech': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'Artisan': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    'Community': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    'Sustainable': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    'default': 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  };

  return (
    <div 
      ref={cardRef}
      className="ubuntu-card-expanded bg-[#1a1a1a] rounded-xl p-6 border border-[#333] text-white"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Member Core</p>
          <h3 className="mt-1 text-xl font-black tracking-tight">{memberCore.displayName}</h3>
          <p className="text-xs text-slate-500">Member since {memberCore.memberSince}</p>
        </div>
        <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getTierColor(memberCore.contributionTier)} text-white text-xs font-bold uppercase border`}>
          {memberCore.contributionTier}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-3xl font-black text-white">{memberCore.ubuntuScore}</span>
          </div>
          {memberCore.scoreChange !== 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`absolute -top-1 -right-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                memberCore.scoreChange > 0 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-red-500 text-white'
              }`}
            >
              {memberCore.scoreChange > 0 ? '+' : ''}{memberCore.scoreChange}
            </motion.div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-400">Ubuntu Score</p>
          <div className="mt-1 h-2 bg-[#333] rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: isVisible ? `${memberCore.ubuntuScore}%` : '0%' }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      <hr className="border-[#333] my-6" />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`p-4 rounded-lg border ${getHealthBg(poolHealth.status)}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-400">Pool Health</p>
          </div>
          <div className="flex justify-center">
            <HealthGaugeSVG score={poolHealth.score} status={poolHealth.status} />
          </div>
          <p className={`mt-2 text-xs text-center font-medium ${getHealthColor(poolHealth.status)}`}>
            {poolHealth.status === 'thriving' ? 'Thriving' : 
             poolHealth.status === 'stable' ? 'Stable' : 
             poolHealth.status === 'stressed' ? 'Stressed' : 'Critical'}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-400">Safety Buffer</p>
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded uppercase font-bold">
              Compounding
            </span>
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">
            ${(poolHealth.compoundingValue || poolHealth.safetyBuffer / 100).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            of ${(poolHealth.targetBuffer / 100).toLocaleString()} target
          </p>
          <div className="mt-2 h-1.5 bg-[#333] rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-amber-400"
              initial={{ width: 0 }}
              animate={{ width: isVisible ? `${(poolHealth.safetyBuffer / poolHealth.targetBuffer) * 100}%` : '0%' }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {memberCore.socialInterests && memberCore.socialInterests.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Social Interests</p>
          <div className="flex flex-wrap gap-2">
            {memberCore.socialInterests.map((interest, i) => (
              <span 
                key={i} 
                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  interestColors[interest] || interestColors.default
                }`}
              >
                #{interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {villagePulse && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Village Pulse</p>
            {isLoadingPulse && (
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          
          {isLoadingPulse ? (
            <div className="h-16 flex items-center justify-center text-sm text-slate-500">
              Loading pulse...
            </div>
          ) : pulseData ? (
            <>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <p className="text-sm">
                  <span className="font-black text-emerald-400">{pulseData.peerMatches}</span>
                  <span className="text-slate-400"> peers share your interests</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {pulseData.sharedInterests.slice(0, 4).map((interest, i) => (
                    <span key={i} className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs rounded-full">
                      #{interest}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function LazySocialEmbed({ 
  platform, 
  username,
  visible 
}: { 
  platform: 'instagram' | 'tiktok' | 'spotify' | 'x' | 'threads';
  username: string;
  visible: boolean;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (visible && !isLoaded) {
      const timer = setTimeout(() => setIsLoaded(true), 300);
      return () => clearTimeout(timer);
    }
  }, [visible, isLoaded]);

  if (!visible) return null;

  const platformIcons: Record<string, string> = {
    instagram: '📸',
    tiktok: '🎵',
    spotify: '🎧',
    x: '𝕏',
    threads: '🧵',
  };

  const platformColors: Record<string, string> = {
    instagram: 'from-pink-500 to-purple-500',
    tiktok: 'from-cyan-400 to-pink-400',
    spotify: 'from-green-400 to-green-600',
    x: 'from-slate-400 to-slate-600',
    threads: 'from-slate-600 to-slate-800',
  };

  return (
    <div className="p-4 rounded-lg bg-[#1a1a1a] border border-[#333]">
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xl bg-gradient-to-r ${platformColors[platform]} bg-clip-text text-transparent`}>
          {platformIcons[platform]}
        </span>
        <span className="font-medium">@{username}</span>
      </div>
      
      {isLoaded ? (
        <div className="aspect-square bg-[#222] rounded-lg flex items-center justify-center">
          <p className="text-sm text-slate-500">
            {platform.charAt(0).toUpperCase() + platform.slice(1)} content
          </p>
        </div>
      ) : (
        <div className="aspect-square bg-[#222]/50 rounded-lg animate-pulse" />
      )}
    </div>
  );
}

export function useIntersectionObserver(
  callback: () => void,
  threshold: number = 0.1
) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callback();
        }
      },
      { threshold }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [target, callback, threshold]);

  return setTarget;
}
