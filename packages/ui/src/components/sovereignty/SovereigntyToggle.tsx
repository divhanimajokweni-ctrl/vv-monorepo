'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface IntentTag {
  id: string;
  category: string;
  value: string;
  source: string;
  strength: number;
  expiresAt: string;
}

export interface SovereigntyState {
  sovereigntyEnabled: boolean;
  profileType: string;
  intentTags: IntentTag[];
  aggregatedScore: number;
  allowedSources: string[];
  tagCategories: {
    esg: boolean;
    community: boolean;
    entrepreneur: boolean;
    lifestyle: boolean;
  };
}

interface SovereigntyToggleProps {
  memberId: string;
  initialState?: Partial<SovereigntyState>;
  onToggle?: (enabled: boolean) => void;
}

export function SovereigntyToggle({ 
  memberId, 
  initialState,
  onToggle 
}: SovereigntyToggleProps) {
  const [isEnabled, setIsEnabled] = useState(initialState?.sovereigntyEnabled ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const [tags, setTags] = useState<IntentTag[]>(initialState?.intentTags || []);
  const [profileType, setProfileType] = useState(initialState?.profileType || 'blank');
  const [score, setScore] = useState(initialState?.aggregatedScore || 0);

  useEffect(() => {
    if (initialState?.intentTags) {
      setTags(initialState.intentTags);
    }
    if (initialState?.profileType) {
      setProfileType(initialState.profileType);
    }
    if (initialState?.aggregatedScore) {
      setScore(initialState.aggregatedScore);
    }
  }, [initialState]);

  const handleToggle = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/sovereignty/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, enabled: !isEnabled }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsEnabled(data.sovereigntyEnabled);
        setTags(data.intentTags || []);
        setProfileType(data.profileType || 'blank');
        setScore(data.aggregatedScore || 0);
        onToggle?.(data.sovereigntyEnabled);
      }
    } catch (error) {
      console.error('Failed to toggle sovereignty:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProfileTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      blank: 'Blank Member',
      esg_focused: 'ESG-Focused Member',
      community_anchor: 'Community Anchor',
      entrepreneur: 'Entrepreneur',
      mixed: 'Multi-Interest Member',
    };
    return labels[type] || 'Unknown';
  };

  return (
    <div className="up-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Sovereignty Toggle</h3>
          <p className="text-sm text-slate-400">
            Control how your social data shapes financial opportunities
          </p>
        </div>
        
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`
            relative w-16 h-8 rounded-full transition-all duration-300
            ${isEnabled ? 'bg-emerald-500' : 'bg-slate-600'}
            ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
          `}
        >
          <motion.div
            className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
            animate={{ left: isEnabled ? '2rem' : '0.5rem' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className={`
          w-3 h-3 rounded-full
          ${isEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}
        `} />
        <span className={`text-sm font-medium ${isEnabled ? 'text-emerald-400' : 'text-slate-400'}`}>
          {isEnabled ? 'Data Layer Active' : 'Data Layer Dormant'}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {isEnabled ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="up-card p-4 bg-slate-800/50">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Profile Type</p>
                <p className="text-lg font-bold text-white mt-1">
                  {getProfileTypeLabel(profileType)}
                </p>
              </div>
              <div className="up-card p-4 bg-slate-800/50">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Signal Strength</p>
                <p className="text-lg font-bold text-emerald-400 mt-1">
                  {score}/100
                </p>
              </div>
            </div>

            {tags.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                  Active Intent Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <motion.div
                      key={tag.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-medium
                        ${tag.category === 'ESG' || tag.category === 'Energy' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : tag.category === 'Community' || tag.category === 'Housing'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : tag.category === 'Entrepreneur' || tag.category === 'Tech'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }
                      `}
                    >
                      #{tag.value}
                      <span className="ml-1 opacity-60">
                        {Math.round(tag.strength * 100)}%
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-start gap-3">
                <span className="text-amber-400 text-lg">🛡️</span>
                <div>
                  <p className="text-sm font-medium text-amber-300">Digital Sovereignty Active</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Your data vibrations are being anonymized. Intent tags expire after 30 days of inactivity.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-lg bg-slate-800/50 border border-slate-700"
          >
            <div className="flex items-start gap-3">
              <span className="text-slate-400 text-lg">🔒</span>
              <div>
                <p className="text-sm font-medium text-slate-300">Blank Member Mode</p>
                <p className="text-xs text-slate-500 mt-1">
                  Enable the sovereignty toggle to allow social signals to shape your financial opportunities. 
                  Your data is anonymized and ephemeral.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MatchmakerCardProps {
  title: string;
  description: string;
  matchScore: number;
  poolName: string;
  category: string;
  pricing: {
    baseRate: number;
    ubuntuDiscount: number;
    finalRate: number;
    entryFeeReduction: number;
  };
  onAction?: () => void;
}

export function MatchmakerCard({
  title,
  description,
  matchScore,
  poolName,
  category,
  pricing,
  onAction,
}: MatchmakerCardProps) {
  const categoryColors: Record<string, string> = {
    energy: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    tech: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    housing: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    entrepreneur: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    community: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    general: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  };

  return (
    <div className="up-card p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColors[category] || categoryColors.general}`}>
            {category}
          </span>
          <h4 className="text-white font-bold mt-2">{poolName}</h4>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Match</p>
          <p className="text-xl font-black text-emerald-400">{matchScore}%</p>
        </div>
      </div>

      <p className="text-sm text-slate-400">{description}</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-2 rounded bg-slate-800/50">
          <p className="text-xs text-slate-500">Base Rate</p>
          <p className="text-sm text-slate-300 line-through">{(pricing.baseRate / 100).toFixed(2)}%</p>
        </div>
        <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30">
          <p className="text-xs text-emerald-500">Your Rate</p>
          <p className="text-sm font-bold text-emerald-400">{(pricing.finalRate / 100).toFixed(2)}%</p>
        </div>
      </div>

      {pricing.entryFeeReduction > 0 && (
        <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-center">
          <p className="text-xs text-amber-400">
            🎉 {pricing.entryFeeReduction}% Entry Fee Reduction
          </p>
        </div>
      )}

      <button
        onClick={onAction}
        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Explore Opportunity
      </button>
    </div>
  );
}

interface ProsperityOpportunityCardProps {
  opportunity: {
    title: string;
    description: string;
    matchScore: number;
    ubuntuScore: number;
    socialAccordSynergy: number;
    combinedScore: number;
    callToAction: string;
    recommendedPools: MatchmakerCardProps[];
  };
}

export function ProsperityOpportunityCard({ opportunity }: ProsperityOpportunityCardProps) {
  return (
    <div className="up-card up-border-gradient p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl">✨</span>
        <h3 className="text-xl font-bold text-white">{opportunity.title}</h3>
      </div>

      <p className="text-sm text-slate-300">{opportunity.description}</p>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded bg-slate-800/50 text-center">
          <p className="text-xs text-slate-500">Ubuntu Score</p>
          <p className="text-lg font-black text-white">{opportunity.ubuntuScore}</p>
        </div>
        <div className="p-3 rounded bg-slate-800/50 text-center">
          <p className="text-xs text-slate-500">Social Synergy</p>
          <p className="text-lg font-black text-blue-400">{opportunity.socialAccordSynergy}</p>
        </div>
        <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/30 text-center">
          <p className="text-xs text-emerald-500">Combined</p>
          <p className="text-lg font-black text-emerald-400">{opportunity.combinedScore}</p>
        </div>
      </div>

      {opportunity.recommendedPools.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Recommended Pools</p>
          <div className="grid gap-2">
            {opportunity.recommendedPools.slice(0, 2).map((pool, index) => (
              <MatchmakerCard key={index} {...pool} />
            ))}
          </div>
        </div>
      )}

      <button className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg transition-all">
        {opportunity.callToAction}
      </button>
    </div>
  );
}
