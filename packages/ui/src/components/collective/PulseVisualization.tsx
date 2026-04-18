'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCollectivePulse, type CollectivePulse, type CommunityMetrics } from '@/lib/websocket/client';

export function CollectivePulseVisualization() {
  const { pulses, metrics, isConnected } = useCollectivePulse();

  return (
    <div className="relative w-full h-96 bg-neutral-900 rounded-xl overflow-hidden">
      <div className="absolute inset-0">
        <PulseCanvas pulses={pulses} />
      </div>
      
      <div className="absolute top-4 left-4 z-10">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-neutral-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {pulses.slice(-3).map((pulse) => (
          <PulseNotification key={pulse.id} pulse={pulse} />
        ))}
      </AnimatePresence>

      <div className="absolute bottom-4 left-4 right-4 z-10">
        <MetricsBar metrics={metrics} />
      </div>
    </div>
  );
}

function PulseCanvas({ pulses }: { pulses: CollectivePulse[] }) {
  return (
    <div className="absolute inset-0">
      {pulses.map((pulse, i) => (
        <motion.div
          key={pulse.id}
          className="absolute rounded-full opacity-20"
          style={{
            backgroundColor: pulse.visualization.color,
            left: `${30 + (i * 20)}%`,
            top: `${40 + (i * 10)}%`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 2, 0],
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: pulse.visualization.duration / 1000,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

function PulseNotification({ pulse }: { pulse: CollectivePulse }) {
  const labels: Record<string, string> = {
    contribution: 'New Contribution',
    achievement: 'Achievement Unlocked',
    trust_update: 'Trust Extended',
    governance_vote: 'Governance Vote',
    milestone: 'Community Milestone',
  };

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      className="absolute top-4 right-4 bg-neutral-800 border border-neutral-700 rounded-lg p-3 shadow-lg"
      style={{ borderLeftColor: pulse.visualization.color, borderLeftWidth: 4 }}
    >
      <p className="text-sm font-medium text-white">{labels[pulse.type] || pulse.type}</p>
      <p className="text-xs text-neutral-400">
        Impact: {pulse.communityImpact}
      </p>
    </motion.div>
  );
}

function MetricsBar({ metrics }: { metrics: CommunityMetrics }) {
  return (
    <div className="flex justify-between items-center bg-neutral-800/80 backdrop-blur-sm rounded-lg px-4 py-2">
      <MetricItem label="Contributions" value={metrics.totalContributions} color="#3B82F6" />
      <MetricItem label="Active Members" value={metrics.activeMembers} color="#10B981" />
      <MetricItem label="Trust Circles" value={metrics.trustCircles} color="#8B5CF6" />
      <MetricItem label="Governance" value={metrics.governanceParticipation} color="#F59E0B" />
      <MetricItem label="Prosperity" value={metrics.collectiveProsperity} color="#EC4899" />
    </div>
  );
}

function MetricItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <motion.div
        className="text-lg font-bold"
        style={{ color }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        key={value}
      >
        {value.toLocaleString()}
      </motion.div>
      <div className="text-xs text-neutral-500">{label}</div>
    </div>
  );
}
