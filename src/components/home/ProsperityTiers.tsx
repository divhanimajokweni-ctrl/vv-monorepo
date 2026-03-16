'use client';

import { motion } from 'framer-motion';

interface Tier {
  id: string;
  name: string;
  description: string;
  icon: string;
  features: string[];
  color: string;
}

const tiers: Tier[] = [
  {
    id: 'family-wealth',
    name: 'Family Wealth Reserve',
    description: 'Succession Rules for generational wealth transfer',
    icon: '🌳',
    features: [
      'Trust DNA inheritance',
      'Pool position transfer',
      'Multi-generational tracking',
    ],
    color: 'earth',
  },
  {
    id: 'sme-bulk',
    name: 'SME Bulk-Buying Circle',
    description: 'Pool power with local businesses',
    icon: '🤝',
    features: [
      'Wholesale discounts',
      'AI Proposal Architect',
      'Makro negotiation',
    ],
    color: 'harvest',
  },
  {
    id: 'youth-unity',
    name: 'Youth Unity Fund',
    description: 'Empower the next generation',
    icon: '🌟',
    features: [
      'Educational grants',
      'Mentorship matching',
      'Skill development',
    ],
    color: 'clay',
  },
];

export function ProsperityTiers() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-card p-6 rounded-2xl"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Prosperity Tiers</h3>
        <span className="text-xs px-2 py-1 rounded-full bg-harvest/20 text-harvest">Collective Growth</span>
      </div>

      <div className="space-y-3">
        {tiers.map((tier, index) => (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            className="tier-card group cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center text-2xl">
                {tier.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-medium group-hover:text-harvest transition-colors">
                    {tier.name}
                  </h4>
                  <span className="text-xs text-neutral-500">Join Circle</span>
                </div>
                <p className="text-neutral-400 text-sm mb-2">{tier.description}</p>
                <div className="flex flex-wrap gap-2">
                  {tier.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-2 py-0.5 rounded-full bg-neutral-800/50 text-neutral-400 text-xs"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
