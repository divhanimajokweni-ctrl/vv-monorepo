'use client';

import { motion } from 'framer-motion';

interface WelcomeDashboardProps {
  userName?: string;
}

const stats = [
  { label: 'Ubuntu Score', value: '847', change: '+12', trend: 'up' },
  { label: 'Trust Circle', value: '24', change: '+3', trend: 'up' },
  { label: 'Contributions', value: '47', change: '+5', trend: 'up' },
  { label: 'Impact Points', value: '2,840', change: '+156', trend: 'up' },
];

export function WelcomeDashboard({ userName = 'Ubuntu Member' }: WelcomeDashboardProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card warm-glow p-6 mb-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-harvest-light text-sm font-medium mb-1">{getGreeting()}</p>
          <h2 className="text-2xl font-bold text-white mb-1">{userName}</h2>
          <p className="text-neutral-400 text-sm">&quot;I am because we are&quot; — Your digital Ubuntu journey continues</p>
        </div>
        <div className="hidden md:block">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-earth via-harvest to-clay flex items-center justify-center animate-float">
            <span className="text-2xl">🌱</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="stat-card"
          >
            <p className="text-neutral-400 text-xs mb-1">{stat.label}</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-white">{stat.value}</span>
              <span className={`text-xs ${stat.trend === 'up' ? 'text-earth-light' : 'text-clay'}`}>
                {stat.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
