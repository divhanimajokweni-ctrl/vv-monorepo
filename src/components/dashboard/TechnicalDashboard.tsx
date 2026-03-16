'use client';

import { motion } from 'framer-motion';

interface MetricData {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: number[];
}

interface TechnicalDashboardProps {
  ledgerPostTime?: MetricData;
  hashContinuity?: {
    status: 'healthy' | 'compromised' | 'unknown';
    lastVerified: string;
    chainLength: number;
  };
  rtbfRequests?: Array<{
    id: string;
    userId: string;
    status: 'pending' | 'processing' | 'completed';
    requestedAt: string;
  }>;
}

export function TechnicalDashboard({
  ledgerPostTime = {
    name: 'Ledger Post Time',
    value: 45,
    unit: 'ms',
    status: 'good',
    trend: [52, 48, 45, 42, 45],
  },
  hashContinuity = {
    status: 'healthy',
    lastVerified: new Date().toISOString(),
    chainLength: 15234,
  },
  rtbfRequests = [],
}: TechnicalDashboardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
      case 'healthy':
        return 'text-earth';
      case 'warning':
      case 'processing':
        return 'text-harvest';
      case 'critical':
      case 'compromised':
        return 'text-red-500';
      default:
        return 'text-neutral-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'good':
      case 'healthy':
        return 'bg-earth/20';
      case 'warning':
      case 'processing':
        return 'bg-harvest/20';
      case 'critical':
      case 'compromised':
        return 'bg-red-500/20';
      default:
        return 'bg-neutral-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900 rounded-xl border border-neutral-800 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-neutral-400">Ledger Performance</h3>
            <div className={`w-3 h-3 rounded-full ${getStatusBg(ledgerPostTime.status)}`}>
              <div className={`w-full h-full rounded-full ${getStatusColor(ledgerPostTime.status).replace('text-', 'bg-')}`} />
            </div>
          </div>
          
          <div className="flex items-baseline gap-1 mb-4">
            <span className={`text-3xl font-bold ${getStatusColor(ledgerPostTime.status)}`}>
              {ledgerPostTime.value}
            </span>
            <span className="text-neutral-500">{ledgerPostTime.unit}</span>
          </div>
          
          <div className="flex items-end gap-1 h-8">
            {ledgerPostTime.trend.map((val, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${(val / 60) * 100}%` }}
                transition={{ delay: i * 0.1 }}
                className={`flex-1 rounded-t ${getStatusColor(ledgerPostTime.status).replace('text-', 'bg-')} opacity-70`}
              />
            ))}
          </div>
          
          <div className="mt-2 text-xs text-neutral-500">
            Last 5 postings
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-neutral-900 rounded-xl border border-neutral-800 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-neutral-400">Hash Chain Integrity</h3>
            <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusBg(hashContinuity.status)} ${getStatusColor(hashContinuity.status)}`}>
              {hashContinuity.status === 'healthy' ? '✓ Verified' : '⚠ Alert'}
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Chain Length</span>
              <span className="font-mono text-sm text-white">
                {hashContinuity.chainLength.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Last Verified</span>
              <span className="text-xs text-neutral-400">
                {new Date(hashContinuity.lastVerified).toLocaleTimeString()}
              </span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-neutral-800">
            <button className="w-full py-2 bg-earth/20 text-earth text-sm rounded hover:bg-earth/30 transition-colors">
              Run Integrity Check
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-neutral-900 rounded-xl border border-neutral-800 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-neutral-400">System Health</h3>
            <span className="text-earth text-xs">● Live</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">Uptime</span>
              <span className="text-earth">99.97%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">Active Nodes</span>
              <span className="text-white">12 / 12</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">Consensus</span>
              <span className="text-harvest">100%</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-neutral-800">
            <div className="text-xs text-neutral-500 mb-2">Edge Response</div>
            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full w-[92%] bg-earth rounded-full" />
            </div>
            <div className="text-right text-xs text-earth mt-1">92ms</div>
          </div>
        </motion.div>
      </div>

      {rtbfRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-neutral-900 rounded-xl border border-neutral-800 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-clay text-xl">🗑️</span>
            <div>
              <h3 className="text-lg font-semibold text-white">Identity Audit</h3>
              <p className="text-xs text-neutral-400">Right to be Forgotten (RTBF) Requests</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {rtbfRequests.map(request => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-neutral-400">
                    {request.userId.slice(0, 8)}...
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    request.status === 'completed' ? 'bg-earth/20 text-earth' :
                    request.status === 'processing' ? 'bg-harvest/20 text-harvest' :
                    'bg-neutral-700 text-neutral-400'
                  }`}>
                    {request.status}
                  </span>
                </div>
                <span className="text-xs text-neutral-500">
                  {new Date(request.requestedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
