'use client';

import { motion } from 'framer-motion';

interface ActivityItem {
  id: string;
  type: 'contribution' | 'vouch' | 'badge' | 'payment' | 'governance';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'contribution',
    title: 'Knowledge Contribution',
    description: 'Updated documentation on governance proposals',
    timestamp: '2 hours ago',
    icon: '📚',
  },
  {
    id: '2',
    type: 'badge',
    title: 'Badge Received',
    description: 'Community Builder badge from Alice',
    timestamp: '5 hours ago',
    icon: '🏆',
  },
  {
    id: '3',
    type: 'vouch',
    title: 'New Member Vouched',
    description: 'Vouched for newcomer in Trust Circle',
    timestamp: '1 day ago',
    icon: '🤝',
  },
  {
    id: '4',
    type: 'payment',
    title: 'Pool Contribution',
    description: 'R 500.00 added to collective pool',
    timestamp: '2 days ago',
    icon: '💚',
  },
  {
    id: '5',
    type: 'governance',
    title: 'Proposal Voted',
    description: 'Voted on SME Bulk-Buying initiative',
    timestamp: '3 days ago',
    icon: '🗳️',
  },
];

export function ActivityFeed() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-6 rounded-2xl"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Recent Activity</h3>
        <button className="text-harvest text-sm hover:underline">View All</button>
      </div>

      <div className="space-y-4">
        {mockActivities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="activity-item py-2"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-sm flex-shrink-0">
                {activity.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{activity.title}</p>
                <p className="text-neutral-400 text-xs truncate">{activity.description}</p>
              </div>
              <span className="text-neutral-500 text-xs flex-shrink-0">{activity.timestamp}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
