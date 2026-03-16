'use client';

import { motion } from 'framer-motion';

interface ResourceItem {
  id: string;
  label: string;
  description: string;
  icon: string;
  href: string;
}

const resources: ResourceItem[] = [
  {
    id: 'billing',
    label: 'Billing & Payments',
    description: 'Manage your contributions and invoices',
    icon: '💳',
    href: '#',
  },
  {
    id: 'docs',
    label: 'Documentation',
    description: 'Find clarity on our ecosystem',
    icon: '📖',
    href: '#',
  },
  {
    id: 'fica',
    label: 'FICA Status',
    description: 'Verify your compliance status',
    icon: '✅',
    href: '#',
  },
  {
    id: 'audit',
    label: 'Platform Audit',
    description: 'Philosophy & Trust transparency',
    icon: '🔍',
    href: '#',
  },
];

export function QuickResources() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-6 rounded-2xl"
    >
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-white font-semibold">Quick Resources</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-harvest/20 text-harvest">Community coordination</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {resources.map((resource, index) => (
          <motion.a
            key={resource.id}
            href={resource.href}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="resource-link"
          >
            <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-lg">
              {resource.icon}
            </div>
            <div>
              <p className="text-white text-sm font-medium">{resource.label}</p>
              <p className="text-neutral-500 text-xs">{resource.description}</p>
            </div>
          </motion.a>
        ))}
      </div>

      <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-earth/10 via-harvest/5 to-clay/10 border border-earth/20">
        <p className="text-neutral-300 text-sm italic">&quot;Knowledge is the shared fire of the community.&quot;</p>
      </div>
    </motion.div>
  );
}
