'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface Contribution {
  id: string;
  contributor: string;
  type: 'knowledge' | 'curation' | 'support' | 'liquidity';
  amount: number;
  recipientsCount: number;
  timestamp: number;
  impact: number;
}

interface ContributionResonanceProps {
  contributions: Contribution[];
}

export function ContributionResonance({ contributions }: ContributionResonanceProps) {
  const totalImpact = contributions.reduce((sum, c) => sum + c.impact, 0);
  const maxImpact = Math.max(...contributions.map(c => c.impact), 1);

  return (
    <div className="relative w-full h-[500px] bg-neutral-900 rounded-xl overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <CenterImpactDisplay totalImpact={totalImpact} />
      </div>

      <AnimatePresence>
        {contributions.map((contribution, i) => (
          <ResonanceRipple
            key={contribution.id}
            contribution={contribution}
            maxImpact={maxImpact}
            index={i}
          />
        ))}
      </AnimatePresence>

      <ContributionLegend />
    </div>
  );
}

function CenterImpactDisplay({ totalImpact }: { totalImpact: number }) {
  return (
    <motion.div
      className="text-center z-10"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 100 }}
    >
      <motion.div
        className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-blue-500 to-purple-500"
        animate={{ 
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        style={{ backgroundSize: '200% 200%' }}
      >
        {totalImpact.toLocaleString()}
      </motion.div>
      <div className="text-neutral-400 mt-2">Total Community Impact</div>
    </motion.div>
  );
}

function ResonanceRipple({ contribution, maxImpact, index }: { 
  contribution: Contribution; 
  maxImpact: number; 
  index: number;
}) {
  const colors: Record<string, string> = {
    knowledge: '#3B82F6',
    curation: '#8B5CF6',
    support: '#10B981',
    liquidity: '#F59E0B',
  };

  const radius = 50 + ((contribution.impact / maxImpact) * 200);
  const opacity = 0.1 + ((contribution.impact / maxImpact) * 0.4);
  const delay = index * 0.2;

  return (
    <motion.div
      className="absolute rounded-full border-2"
      style={{
        width: radius * 2,
        height: radius * 2,
        borderColor: colors[contribution.type],
        opacity: 0,
        left: '50%',
        top: '50%',
        x: -radius,
        y: -radius,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: [0, 1.5, 2],
        opacity: [0, opacity, 0],
      }}
      transition={{
        duration: 3,
        delay,
        ease: 'easeOut',
        times: [0, 0.3, 1],
      }}
    >
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <motion.span
          className="text-xs font-medium px-2 py-1 rounded"
          style={{ backgroundColor: colors[contribution.type] }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: [0, 1, 0], y: -20 }}
          transition={{ duration: 2, delay: delay }}
        >
          +{contribution.impact} impact
        </motion.span>
      </div>
    </motion.div>
  );
}

function ContributionLegend() {
  const types = [
    { type: 'knowledge', label: 'Knowledge', color: '#3B82F6' },
    { type: 'curation', label: 'Curation', color: '#8B5CF6' },
    { type: 'support', label: 'Support', color: '#10B981' },
    { type: 'liquidity', label: 'Liquidity', color: '#F59E0B' },
  ];

  return (
    <div className="absolute bottom-4 left-4 bg-neutral-800/80 backdrop-blur-sm rounded-lg p-3">
      <h4 className="text-xs font-medium text-white mb-2">Contribution Types</h4>
      <div className="flex flex-wrap gap-2">
        {types.map(({ type, label, color }) => (
          <div key={type} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-neutral-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
