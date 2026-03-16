'use client';

import { motion } from 'framer-motion';

interface TribalImpactProps {
  userId: string;
  displayName: string;
  trustScore: number;
  totalContributions: number;
  communityImpact: number;
  shadowWorkRecognition: number;
  contributionsHistory: Array<{
    type: 'knowledge' | 'support' | 'curation' | 'liquidity' | 'governance';
    amount: number;
    timestamp: number;
    description: string;
  }>;
}

const contributionIcons: Record<string, string> = {
  knowledge: '📚',
  support: '🤝',
  curation: '✨',
  liquidity: '💧',
  governance: '🗳️',
};

const contributionColors: Record<string, string> = {
  knowledge: 'text-earth',
  support: 'text-harvest',
  curation: 'text-purple-400',
  liquidity: 'text-blue-400',
  governance: 'text-clay',
};

export function TribalImpactDashboard({
  userId,
  displayName,
  trustScore,
  totalContributions,
  communityImpact,
  shadowWorkRecognition,
  contributionsHistory,
}: TribalImpactProps) {
  return (
    <div className="space-y-6">
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-earth via-harvest to-clay flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {displayName.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{displayName}</h2>
              <p className="text-sm text-neutral-400 font-mono">{userId}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-earth/20 text-earth text-xs rounded-full">
                  Trust: {trustScore}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-neutral-800/50 rounded-lg p-4 text-center"
          >
            <div className="tribal-impact-metric">{totalContributions}</div>
            <div className="text-sm text-neutral-400">Total Contributions</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-neutral-800/50 rounded-lg p-4 text-center"
          >
            <div className="tribal-impact-metric">{communityImpact.toLocaleString()}</div>
            <div className="text-sm text-neutral-400">Community Impact</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-neutral-800/50 rounded-lg p-4 text-center"
          >
            <div className="tribal-impact-metric">{shadowWorkRecognition}</div>
            <div className="text-sm text-neutral-400">Shadow Work Badges</div>
          </motion.div>
        </div>

        <div className="border-t border-neutral-800 pt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Contributions</h3>
          <div className="space-y-3">
            {contributionsHistory.map((contribution, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 bg-neutral-800/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {contributionIcons[contribution.type]}
                  </span>
                  <div>
                    <div className={`text-sm font-medium ${contributionColors[contribution.type]}`}>
                      {contribution.description}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {new Date(contribution.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className={`text-sm font-bold ${contributionColors[contribution.type]}`}>
                  +{contribution.amount}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Dignity Notifications</h3>
        <div className="space-y-3">
          <div className="dignity-notification">
            <span className="text-2xl">🎉</span>
            <div>
              <div className="text-sm font-medium text-earth">Thank you for your shadow work!</div>
              <div className="text-xs text-neutral-400">Your bug report helped improve the platform for everyone</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
