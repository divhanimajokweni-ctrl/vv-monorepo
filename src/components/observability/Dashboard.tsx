'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  components: Record<string, { status: string; latency: number | null; lastCheck: string }>;
  uptime: number;
  version: string;
}

interface TransparencyMetrics {
  networkLatency: { global: number; byRegion: Record<string, number> };
  trustFlow: { totalTrustExtensions: number; activeTrustCircles: number; averageTrustScore: number };
  governance: { activeProposals: number; participationRate: number; averageVoterTurnout: number };
  resourceCirculation: { totalValueExchanged: number; circulationVelocity: number; activeParticipants: number };
  integrity: { lastVerified: string; hashChainValid: boolean; eventsCount: number };
}

export function ObservabilityDashboard() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [metrics, setMetrics] = useState<TransparencyMetrics | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [healthRes, metricsRes] = await Promise.all([
          fetch('/api/observability/health'),
          fetch('/api/observability/metrics'),
        ]);
        setHealth(await healthRes.json());
        setMetrics(await metricsRes.json());
      } catch (e) {
        console.error('Failed to fetch observability data', e);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!health || !metrics) {
    return (
      <div className="w-full h-96 bg-neutral-900 rounded-xl flex items-center justify-center">
        <div className="text-neutral-500">Loading transparency dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SystemHealthPanel health={health} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NetworkLatencyPanel latency={metrics.networkLatency} />
        <TrustFlowPanel trust={metrics.trustFlow} />
        <GovernancePanel governance={metrics.governance} />
        <ResourceCirculationPanel resources={metrics.resourceCirculation} />
      </div>
      <IntegrityPanel integrity={metrics.integrity} />
    </div>
  );
}

function SystemHealthPanel({ health }: { health: SystemHealth }) {
  const statusColors = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    critical: 'bg-red-500',
  };

  return (
    <div className="bg-neutral-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">System Health</h3>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${statusColors[health.status]}`} />
          <span className="text-sm text-neutral-400 capitalize">{health.status}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(health.components).map(([name, component]) => (
          <motion.div
            key={name}
            className="bg-neutral-700 rounded-lg p-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-neutral-400 capitalize">{name}</span>
              <div className={`w-2 h-2 rounded-full ${
                component.status === 'up' ? 'bg-green-500' : 
                component.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
            </div>
            <div className="text-sm font-medium text-white">
              {component.latency !== null ? `${component.latency}ms` : 'N/A'}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function NetworkLatencyPanel({ latency }: { latency: TransparencyMetrics['networkLatency'] }) {
  return (
    <div className="bg-neutral-800 rounded-xl p-4">
      <h3 className="text-lg font-semibold text-white mb-3">Network Latency</h3>
      <div className="text-3xl font-bold text-green-400 mb-3">{latency.global}ms global</div>
      <div className="space-y-2">
        {Object.entries(latency.byRegion).map(([region, ms]) => (
          <div key={region} className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 uppercase">{region}</span>
            <div className="flex-1 mx-2 h-2 bg-neutral-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  backgroundColor: ms < 50 ? '#10B981' : ms < 100 ? '#F59E0B' : '#EF4444',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((ms / 200) * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs text-neutral-300 w-12 text-right">{ms}ms</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrustFlowPanel({ trust }: { trust: TransparencyMetrics['trustFlow'] }) {
  return (
    <div className="bg-neutral-800 rounded-xl p-4">
      <h3 className="text-lg font-semibold text-white mb-3">Trust Flow</h3>
      <div className="grid grid-cols-3 gap-3">
        <TrustMetric value={trust.totalTrustExtensions} label="Trust Extended" />
        <TrustMetric value={trust.activeTrustCircles} label="Active Circles" />
        <TrustMetric value={trust.averageTrustScore} label="Avg Score" suffix="%" />
      </div>
    </div>
  );
}

function TrustMetric({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  return (
    <div className="text-center">
      <motion.div
        className="text-2xl font-bold text-green-400"
        key={value}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
      >
        {value.toLocaleString()}{suffix}
      </motion.div>
      <div className="text-xs text-neutral-400">{label}</div>
    </div>
  );
}

function GovernancePanel({ governance }: { governance: TransparencyMetrics['governance'] }) {
  return (
    <div className="bg-neutral-800 rounded-xl p-4">
      <h3 className="text-lg font-semibold text-white mb-3">Governance</h3>
      <div className="space-y-3">
        <GovernanceBar label="Active Proposals" value={governance.activeProposals} max={20} color="#8B5CF6" />
        <GovernanceBar label="Participation Rate" value={governance.participationRate * 100} max={100} color="#F59E0B" />
        <GovernanceBar label="Voter Turnout" value={governance.averageVoterTurnout * 100} max={100} color="#3B82F6" />
      </div>
    </div>
  );
}

function GovernanceBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-neutral-400">{label}</span>
        <span className="text-neutral-300">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  );
}

function ResourceCirculationPanel({ resources }: { resources: TransparencyMetrics['resourceCirculation'] }) {
  return (
    <div className="bg-neutral-800 rounded-xl p-4">
      <h3 className="text-lg font-semibold text-white mb-3">Resource Circulation</h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{resources.totalValueExchanged.toLocaleString()}</div>
          <div className="text-xs text-neutral-400">Value Exchanged</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">{resources.circulationVelocity.toFixed(2)}x</div>
          <div className="text-xs text-neutral-400">Velocity</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{resources.activeParticipants}</div>
          <div className="text-xs text-neutral-400">Participants</div>
        </div>
      </div>
    </div>
  );
}

function IntegrityPanel({ integrity }: { integrity: TransparencyMetrics['integrity'] }) {
  return (
    <div className="bg-neutral-800 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Data Integrity</h3>
          <p className="text-sm text-neutral-400">
            Last verified: {new Date(integrity.lastVerified).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${integrity.hashChainValid ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-white">
            {integrity.hashChainValid ? 'Hash Chain Valid' : 'Integrity Compromised'}
          </span>
        </div>
      </div>
      <div className="mt-3 text-xs text-neutral-500">
        Events recorded: {integrity.eventsCount.toLocaleString()}
      </div>
    </div>
  );
}
