'use client';

import { motion } from 'framer-motion';
import { useLindiweAdmin } from './LindiweContext';

export function LindiweAdminDashboard() {
  const { analysis, weights, memory, systemStatus, riskHeatmap, evolve } = useLindiweAdmin();

  const getRiskColor = (risk: number) => {
    if (risk > 0.7) return 'bg-red-500';
    if (risk > 0.4) return 'bg-amber-500';
    if (risk > 0.2) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getStrategyBadge = (strategy: string) => {
    switch (strategy) {
      case 'URGENT_SOCIAL_RECAPITALIZATION':
        return { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Critical' };
      case 'SOFT_NUDGE':
        return { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Moderate' };
      case 'DEFENSIVE_HOLD':
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Watch' };
      default:
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Stable' };
    }
  };

  const badge = analysis ? getStrategyBadge(analysis.strategy) : null;

  return (
    <div className="grid grid-cols-12 gap-6 p-8 bg-[color:var(--surface)] min-h-screen">
      <header className="col-span-12 border-b border-[color:var(--border)] pb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[color:var(--accent-sage)] to-[color:var(--accent-gold)] flex items-center justify-center">
            <span className="text-3xl">👑</span>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-[color:var(--text)]">
              Lindiwe System Intelligence
            </h1>
            <p className="mt-1 text-sm text-[color:var(--muted)] italic">
              &ldquo;{systemStatus}&rdquo;
            </p>
          </div>
        </div>
      </header>

      <section className="col-span-12 lg:col-span-8">
        <div className="bg-[color:var(--surface-2)] rounded-2xl p-6 border border-[color:var(--border)]">
          <h3 className="text-lg font-black tracking-tight mb-4 text-[color:var(--text)]">
            Systemic Risk Map
          </h3>
          
          <div className="relative h-72 bg-[color:var(--surface)] rounded-xl overflow-hidden">
            <div className="absolute inset-0 p-4">
              <div className="grid grid-cols-10 grid-rows-10 gap-1 h-full">
                {Array.from({ length: 100 }).map((_, i) => {
                  const row = Math.floor(i / 10);
                  const col = i % 10;
                  const baseValue = Math.sin(row * 0.3) * Math.cos(col * 0.3);
                  const risk = Math.max(0, Math.min(1, (baseValue + 1) / 2 * 0.8 + (riskHeatmap[0]?.risk || 0.2) * 0.2));
                  
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0.5 }}
                      animate={{ 
                        opacity: risk,
                        backgroundColor: risk > 0.7 ? '#ef4444' : risk > 0.4 ? '#f59e0b' : risk > 0.2 ? '#eab308' : '#10b981'
                      }}
                      transition={{ duration: 0.5, delay: i * 0.01 }}
                      className="rounded-sm"
                      title={`Risk: ${(risk * 100).toFixed(0)}%`}
                    />
                  );
                })}
              </div>
            </div>
            
            <div className="absolute bottom-4 left-4 flex gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-red-500" />
                <span className="text-[color:var(--muted)]">Critical</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-amber-500" />
                <span className="text-[color:var(--muted)]">High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-yellow-500" />
                <span className="text-[color:var(--muted)]">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                <span className="text-[color:var(--muted)]">Low</span>
              </div>
            </div>
          </div>
        </div>

        {analysis && (
          <div className="mt-6 bg-[color:var(--surface-2)] rounded-2xl p-6 border border-[color:var(--border)]">
            <h3 className="text-lg font-black tracking-tight mb-4 text-[color:var(--text)]">
              Lindiwe&apos;s Reasoning
            </h3>
            
            <div className="flex items-center gap-3 mb-4">
              {badge && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </span>
              )}
              <span className="text-xs text-[color:var(--muted)] uppercase tracking-wider">
                Strategy: {analysis.strategy.replace(/_/g, ' ')}
              </span>
            </div>
            
            <p className="text-sm text-[color:var(--text)] leading-relaxed">
              {analysis.reasoning}
            </p>

            {analysis.recommendedActions.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-bold text-[color:var(--muted)] uppercase tracking-wider mb-3">
                  Recommended Actions
                </h4>
                <div className="space-y-2">
                  {analysis.recommendedActions.map((action, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-[color:var(--surface)] border border-[color:var(--border)]"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${
                          action.urgency === 'high' ? 'bg-red-500' :
                          action.urgency === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <span className="text-sm font-medium text-[color:var(--text)]">
                          {action.description}
                        </span>
                      </div>
                      <button
                        onClick={() => evolve(analysis.learningToken, true, action.type)}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-[color:var(--accent-gold)] text-white hover:opacity-90"
                      >
                        Approve
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <aside className="col-span-12 lg:col-span-4 space-y-6">
        {analysis?.adminAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-5 rounded-2xl border ${
              analysis.riskLevel === 'critical' 
                ? 'bg-red-500/10 border-red-500/30' 
                : 'bg-amber-500/10 border-amber-500/30'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">⚠️</span>
              <h4 className={`font-bold text-sm ${
                analysis.riskLevel === 'critical' ? 'text-red-400' : 'text-amber-400'
              }`}>
                Admin Alert
              </h4>
            </div>
            <h5 className="font-black text-[color:var(--text)] mb-2">
              {analysis.adminAlert.title}
            </h5>
            <p className="text-sm text-[color:var(--muted)] mb-4">
              {analysis.adminAlert.description}
            </p>
            {analysis.adminAlert.actionRequired && (
              <button className="w-full py-2 rounded-lg bg-red-500 text-white text-sm font-bold">
                Take Action
              </button>
            )}
          </motion.div>
        )}

        <div className="bg-[color:var(--surface-2)] rounded-2xl p-5 border border-[color:var(--border)]">
          <h4 className="font-bold text-sm text-[color:var(--text)] mb-4">
            Cognitive Weights
          </h4>
          <div className="space-y-3">
            {weights && Object.entries(weights).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[color:var(--muted)]">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="font-bold text-[color:var(--text)]">{(value * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-[color:var(--surface)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[color:var(--accent-ubuntu)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${value * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[color:var(--surface-2)] rounded-2xl p-5 border border-[color:var(--border)]">
          <h4 className="font-bold text-sm text-[color:var(--text)] mb-4">
            Self-Learning Log
          </h4>
          {memory.length === 0 ? (
            <p className="text-xs text-[color:var(--muted)]">Building memory...</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {memory.slice().reverse().map((entry, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-[color:var(--surface)] text-xs"
                >
                  <span className={`font-bold ${entry.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    {entry.success ? '✓' : '✗'}
                  </span>
                  <span className="ml-2 text-[color:var(--muted)]">
                    {entry.outcome}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-[color:var(--accent-sage)]/20 to-[color:var(--accent-gold)]/20 rounded-2xl p-5 border border-[color:var(--accent-gold)]/30">
          <h4 className="font-bold text-sm text-[color:var(--accent-gold)] mb-2">
            IP Protection
          </h4>
          <p className="text-xs text-[color:var(--muted)]">
            The &ldquo;Lindiwe Weights&rdquo; coefficients are proprietary trade secrets. 
            Your Village Pulse methodology is uniquely protectable.
          </p>
        </div>
      </aside>
    </div>
  );
}
