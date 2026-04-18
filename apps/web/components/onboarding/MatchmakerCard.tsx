'use client';

import { motion } from 'framer-motion';
import { interestTags, InterestTag } from './InterestPicker';

export interface PoolRecommendation {
  id: string;
  name: string;
  description: string;
  icon: string;
  matchedInterests: string[];
  apy: number;
  members: number;
  minContribution: number;
}

interface MatchmakerCardProps {
  recommendation: PoolRecommendation;
  onJoin?: (poolId: string) => void;
}

export function MatchmakerCard({ recommendation, onJoin }: MatchmakerCardProps) {
  const matchedTags = recommendation.matchedInterests
    .map(id => interestTags.find(t => t.id === id))
    .filter((t): t is InterestTag => t !== undefined);

  const matchScore = Math.round(
    (recommendation.matchedInterests.length / 3) * 100
  );

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl p-5 bg-[color:var(--surface-2)] border border-[color:var(--border)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[color:var(--accent-gold)]/10 flex items-center justify-center text-2xl">
            {recommendation.icon}
          </div>
          <div>
            <h3 className="font-black text-[color:var(--text)]">{recommendation.name}</h3>
            <p className="text-xs text-[color:var(--muted)]">{recommendation.description}</p>
          </div>
        </div>
        <div className="px-2 py-1 rounded-full bg-[color:var(--accent-ubuntu)]/10 text-[color:var(--accent-ubuntu)] text-xs font-bold">
          {matchScore}% match
        </div>
      </div>

      {matchedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {matchedTags.map(tag => (
            <span
              key={tag.id}
              className="px-2 py-0.5 rounded-full bg-[color:var(--accent-ubuntu)]/10 text-[color:var(--accent-ubuntu)] text-xs"
            >
              {tag.label}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs mb-4">
        <div>
          <span className="text-[color:var(--muted)]">APY</span>
          <span className="ml-1 font-bold text-[color:var(--accent-gold)]">{recommendation.apy}%</span>
        </div>
        <div>
          <span className="text-[color:var(--muted)]">Members</span>
          <span className="ml-1 font-bold text-[color:var(--text)]">{recommendation.members}</span>
        </div>
        <div>
          <span className="text-[color:var(--muted)]">Min</span>
          <span className="ml-1 font-bold text-[color:var(--text)]">R{recommendation.minContribution}</span>
        </div>
      </div>

      <motion.button
        onClick={() => onJoin?.(recommendation.id)}
        className="w-full py-2.5 rounded-xl bg-[color:var(--accent-gold)] text-white font-bold text-sm"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Join Pool
      </motion.button>
    </motion.div>
  );
}

interface MatchmakerCarouselProps {
  recommendations: PoolRecommendation[];
  onJoin?: (poolId: string) => void;
}

export function MatchmakerCarousel({ recommendations, onJoin }: MatchmakerCarouselProps) {
  if (recommendations.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-[color:var(--muted)]">Select your interests to see personalized pool recommendations</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {recommendations.map((rec, index) => (
        <motion.div
          key={rec.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <MatchmakerCard recommendation={rec} onJoin={onJoin} />
        </motion.div>
      ))}
    </div>
  );
}

export const mockRecommendations: PoolRecommendation[] = [
  {
    id: 'pool-1',
    name: 'Limpopo Hydroponics',
    description: 'Sustainable urban farming collective',
    icon: '🌱',
    matchedInterests: ['agri', 'solar'],
    apy: 12.5,
    members: 24,
    minContribution: 500,
  },
  {
    id: 'pool-2',
    name: 'Cape Town Solar Co-op',
    description: 'Community-owned solar installations',
    icon: '☀️',
    matchedInterests: ['solar', 'housing'],
    apy: 15.2,
    members: 48,
    minContribution: 1000,
  },
  {
    id: 'pool-3',
    name: 'Youth Tech Academy',
    description: 'Coding scholarships for underserved youth',
    icon: '💻',
    matchedInterests: ['edu', 'tech'],
    apy: 8.7,
    members: 156,
    minContribution: 250,
  },
];
