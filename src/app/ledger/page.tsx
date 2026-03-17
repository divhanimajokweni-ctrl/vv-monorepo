'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { PoolHealthGauge, HealthMetricBar } from '@/components/credit/PoolHealthGauge';

type DashboardSection = 'overview' | 'pools' | 'vault' | 'credit' | 'governance' | 'integrations';

interface IntegrationProvider {
  id: string;
  name: string;
  type: 'bank' | 'payment' | 'identity' | 'analytics' | 'messaging';
  status: 'connected' | 'disconnected' | 'pending' | 'error';
  lastSync?: string;
  features: string[];
  icon: string;
  color: string;
  description: string;
  configFields: string[];
}

interface IntegrationAccount {
  id: string;
  providerId: string;
  name: string;
  type: string;
  balance?: number;
  mask?: string;
}

const availableIntegrations: IntegrationProvider[] = [
  {
    id: 'stitch',
    name: 'Stitch',
    type: 'bank',
    status: 'connected',
    lastSync: '2026-03-17T10:30:00Z',
    features: ['Bank Verification', 'Transaction Sync', 'Instant EFT', 'POPIA Compliant'],
    icon: 'bank',
    color: 'sage',
    description: 'Open banking for South Africa - Connect your bank accounts',
    configFields: ['clientId', 'clientSecret', 'environment'],
  },
  {
    id: 'plaid',
    name: 'Plaid',
    type: 'bank',
    status: 'disconnected',
    features: ['Bank Verification', 'Transaction Sync', 'Identity Verification'],
    icon: 'bank',
    color: 'gold',
    description: 'US banking integration - Coming soon',
    configFields: ['clientId', 'secret', 'environment'],
  },
  {
    id: 'ozow',
    name: 'Ozow',
    type: 'payment',
    status: 'disconnected',
    features: ['Instant EFT', 'Recurring Payments', 'Bank Verification'],
    icon: 'payment',
    color: 'clay',
    description: 'South African instant EFT payments - Coming soon',
    configFields: ['siteCode', 'apiKey', 'environment'],
  },
  {
    id: 'openclaw',
    name: 'OpenClaw',
    type: 'messaging',
    status: 'connected',
    lastSync: '2026-03-17T09:15:00Z',
    features: ['WhatsApp Alerts', 'Signal Alerts', 'Executive C2'],
    icon: 'message',
    color: 'gold',
    description: 'Executive shadow C2 for secure community alerts',
    configFields: ['gatewayUrl', 'apiKey', 'whatsappEnabled'],
  },
  {
    id: 'sentry',
    name: 'Sentry',
    type: 'analytics',
    status: 'connected',
    lastSync: '2026-03-17T10:45:00Z',
    features: ['Error Tracking', 'Performance Monitoring', 'Release Health'],
    icon: 'analytics',
    color: 'clay',
    description: 'Application observability and error tracking',
    configFields: ['dsn', 'org', 'project'],
  },
  {
    id: 'clerk',
    name: 'Clerk',
    type: 'identity',
    status: 'connected',
    lastSync: '2026-03-17T10:00:00Z',
    features: ['SSO', 'MFA', 'User Management', 'Session Management'],
    icon: 'identity',
    color: 'sage',
    description: 'Identity and user management',
    configFields: ['publishableKey', 'secretKey'],
  },
];

const mockIntegrationAccounts: IntegrationAccount[] = [
  { id: 'acc-1', providerId: 'stitch', name: 'Capitec Current', type: 'checking', balance: 15420.50, mask: '4532' },
  { id: 'acc-2', providerId: 'stitch', name: 'Capitec Savings', type: 'savings', balance: 28750.00, mask: '8871' },
  { id: 'acc-3', providerId: 'stitch', name: 'FNB Credit', type: 'credit', balance: -2340.00, mask: '9012' },
];

interface Pool {
  id: string;
  name: string;
  type: 'safety' | 'commons' | 'investment' | 'buying-circle';
  balance: number;
  target: number;
  apy: number;
  status: 'active' | 'growing' | 'locked';
}

const mockPools: Pool[] = [
  { id: 'pool-001', name: 'Safety Net Buffer', type: 'safety', balance: 7500, target: 10000, apy: 4.5, status: 'active' },
  { id: 'pool-002', name: 'Commons Vault', type: 'commons', balance: 7500, target: 10000, apy: 3.2, status: 'locked' },
  { id: 'pool-003', name: 'SME Buying Circle', type: 'buying-circle', balance: 2500, target: 5000, apy: 6.8, status: 'growing' },
  { id: 'pool-004', name: 'Solar Initiative', type: 'investment', balance: 1200, target: 5000, apy: 8.2, status: 'growing' },
];

const coreTools = [
  { id: 'lindiwe', name: 'Lindiwe AI', description: 'Autonomous financial governance agent', icon: 'ai', color: 'sage' },
  { id: 'ubuntu-score', name: 'Ubuntu Score', description: 'Trust & reputation scoring', icon: 'score', color: 'gold' },
  { id: 'pools', name: 'Pool Manager', description: 'Create & manage collective pools', icon: 'pools', color: 'clay' },
  { id: 'credit', name: 'Credit Gateway', description: 'Access collective credit lines', icon: 'credit', color: 'sage' },
  { id: 'governance', name: 'Governance', description: 'Proposals & voting', icon: 'gov', color: 'gold' },
  { id: 'ledger', name: 'Transaction Ledger', description: 'Full financial transparency', icon: 'ledger', color: 'clay' },
  { id: 'sme', name: 'SME Circles', description: 'Group buying collectives', icon: 'sme', color: 'sage' },
  { id: 'analytics', name: 'Analytics', description: 'Pool performance insights', icon: 'analytics', color: 'gold' },
];

export default function LedgerPage() {
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');

  const getPoolProgress = (pool: Pool) => Math.round((pool.balance / pool.target) * 100);
  
  const getStatusColor = (status: Pool['status']) => {
    switch (status) {
      case 'active': return 'text-[color:var(--accent-sage)]';
      case 'growing': return 'text-[color:var(--accent-gold)]';
      case 'locked': return 'text-[color:var(--accent-clay)]';
    }
  };

  const getStatusBg = (status: Pool['status']) => {
    switch (status) {
      case 'active': return 'bg-[color:var(--accent-sage)]/20';
      case 'growing': return 'bg-[color:var(--accent-gold)]/20';
      case 'locked': return 'bg-[color:var(--accent-clay)]/20';
    }
  };

  const ToolIcon = ({ icon, className }: { icon: string; className?: string }) => {
    switch (icon) {
      case 'ai':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'score':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
      case 'pools':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'credit':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'gov':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'ledger':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'sme':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'analytics':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header */}
          <div className="up-card up-border-gradient p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="up-kicker">Ubuntu Pools</p>
                <h1 className="mt-2 text-3xl font-black tracking-tighter">
                  Collective Finances
                </h1>
                <p className="mt-3 text-sm text-[color:var(--muted)]">
                  Your gateway to pool creation, management, and all collective financial tools.
                  The "Holy Grail" of social capital in action.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[color:var(--accent-sage)] animate-pulse" />
                <span className="text-xs font-medium text-[color:var(--accent-sage)]">Live</span>
              </div>
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex flex-wrap gap-2">
            {(['overview', 'pools', 'vault', 'credit', 'governance', 'integrations'] as const).map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`up-pill capitalize ${
                  activeSection === section
                    ? 'border-[color:var(--accent-gold)] text-[color:var(--text)]'
                    : 'opacity-85 hover:opacity-100'
                }`}
              >
                {section === 'overview' ? 'Overview' : section === 'vault' ? 'Vaults' : section === 'integrations' ? 'Connections' : section}
              </button>
            ))}
          </div>

          {/* Overview Section */}
          {activeSection === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              {/* Safety Net Card */}
              <div className="up-card up-border-gradient p-6 bg-gradient-to-br from-sage/10 to-transparent">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-sage/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <p className="up-kicker">Safety Net Buffer</p>
                        <h3 className="text-xl font-black tracking-tighter">Your Financial Shield</h3>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-sage">87%</p>
                    <p className="text-xs text-[color:var(--muted)]">Thriving</p>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[color:var(--muted)]">Building $7,500 of $10,000 target</span>
                        <span className="font-black text-sage">75% Funded</span>
                      </div>
                      <div className="h-3 bg-[color:var(--surface)] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-sage to-[color:var(--accent-gold)]"
                          initial={{ width: 0 }}
                          animate={{ width: '75%' }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                      <p className="mt-2 text-sm text-[color:var(--muted)]">R2,500 To Goal</p>
                    </div>

                    <div className="p-4 bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">✨</span>
                        <span className="text-sm font-black text-[color:var(--accent-gold)]">Active</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs text-[color:var(--muted)]">Principal</p>
                          <p className="text-xl font-black">R7,500</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[color:var(--muted)]">Yield Generated</p>
                          <p className="text-xl font-black text-sage">+$166.44</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-[color:var(--border)] flex justify-between items-center">
                        <div>
                          <p className="text-xs text-[color:var(--muted)]">APY</p>
                          <p className="text-lg font-black text-[color:var(--accent-gold)]">4.5%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[color:var(--muted)]">30-Day Projection</p>
                          <p className="text-lg font-black">+$28.13</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)]">
                      <p className="text-sm font-black text-[color:var(--accent-gold)] mb-3">Yield Generation</p>
                      <p className="text-xs text-[color:var(--muted)] leading-relaxed">
                        Your safety net generates yield while waiting to be deployed. 
                        This is the "Holy Grail" of social capital — money that works for the community.
                      </p>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-[color:var(--accent-sage)]/10 to-[color:var(--accent-gold)]/10 rounded-lg border border-[color:var(--border)]">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-[color:var(--accent-gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span className="text-sm font-black">Compounding 87%</span>
                      </div>
                      <p className="text-xs text-[color:var(--muted)]">
                        Thriving • Your safety net is generating yield
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Commons Vault */}
              <div className="up-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[color:var(--accent-gold)]/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[color:var(--accent-gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="up-kicker">Commons Vault</p>
                    <h3 className="text-xl font-black tracking-tighter">Shared Community Resources</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[color:var(--muted)]">Progress: R7,500 / R10,000</span>
                      <span className="font-black text-[color:var(--accent-gold)]">75.0%</span>
                    </div>
                    <div className="h-3 bg-[color:var(--surface)] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[color:var(--accent-gold)]"
                        initial={{ width: 0 }}
                        animate={{ width: '75%' }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="p-3 bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)] text-center">
                      <p className="text-2xl font-black">0</p>
                      <p className="text-xs text-[color:var(--muted)]">Contributors</p>
                    </div>
                    <div className="p-3 bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)] text-center">
                      <p className="text-2xl font-black text-[color:var(--accent-clay)]">LOCKED</p>
                      <p className="text-xs text-[color:var(--muted)]">Status</p>
                    </div>
                    <div className="p-3 bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)] text-center">
                      <p className="text-2xl font-black text-[color:var(--accent-gold)]">+50</p>
                      <p className="text-xs text-[color:var(--muted)]">API Credits</p>
                    </div>
                  </div>

                  <div className="p-4 bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)]">
                    <p className="text-sm font-black text-[color:var(--accent-gold)]">Next unlock rewards: Boost x1</p>
                  </div>
                </div>
              </div>

              {/* Trust Score */}
              <div className="up-card p-6 bg-gradient-to-br from-[color:var(--accent-gold)]/10 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <PoolHealthGauge score={87} size="lg" />
                    <div>
                      <p className="up-kicker">Your Standing</p>
                      <h3 className="text-2xl font-black tracking-tighter">Trust Score</h3>
                      <p className="text-sm text-[color:var(--accent-sage)]">Thriving</p>
                    </div>
                  </div>
                  <div className="grid gap-3 text-center sm:grid-cols-3">
                    <div className="p-3 bg-[color:var(--surface)] rounded-lg">
                      <p className="text-xl font-black">156</p>
                      <p className="text-xs text-[color:var(--muted)]">Contributions</p>
                    </div>
                    <div className="p-3 bg-[color:var(--surface)] rounded-lg">
                      <p className="text-xl font-black">2,840</p>
                      <p className="text-xs text-[color:var(--muted)]">Community Impact</p>
                    </div>
                    <div className="p-3 bg-[color:var(--surface)] rounded-lg">
                      <p className="text-xl font-black text-[color:var(--accent-gold)]">12</p>
                      <p className="text-xs text-[color:var(--muted)]">Badges Earned</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Pools Section */}
          {activeSection === 'pools' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black tracking-tighter">Your Pools</h2>
                <button className="px-4 py-2 bg-[color:var(--accent-sage)] text-white font-black text-xs uppercase rounded-full hover:bg-[color:var(--accent-sage)]/80 transition-colors">
                  + Create Pool
                </button>
              </div>

              {mockPools.map((pool) => (
                <div key={pool.id} className="up-card p-5 hover:border-[color:var(--accent-sage)]/50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        pool.type === 'safety' ? 'bg-sage/20' :
                        pool.type === 'commons' ? 'bg-[color:var(--accent-gold)]/20' :
                        pool.type === 'buying-circle' ? 'bg-[color:var(--accent-clay)]/20' :
                        'bg-[color:var(--accent-gold)]/20'
                      }`}>
                        {pool.type === 'safety' && (
                          <svg className="w-6 h-6 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        )}
                        {pool.type === 'commons' && (
                          <svg className="w-6 h-6 text-[color:var(--accent-gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        )}
                        {pool.type === 'buying-circle' && (
                          <svg className="w-6 h-6 text-[color:var(--accent-clay)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        )}
                        {pool.type === 'investment' && (
                          <svg className="w-6 h-6 text-[color:var(--accent-gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h3 className="font-black">{pool.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBg(pool.status)} ${getStatusColor(pool.status)}`}>
                          {pool.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black">R{pool.balance.toLocaleString()}</p>
                      <p className="text-xs text-[color:var(--muted)]">of R{pool.target.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-[color:var(--muted)]">Progress</span>
                      <span className="font-black">{getPoolProgress(pool)}%</span>
                    </div>
                    <div className="h-2 bg-[color:var(--surface)] rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${
                          pool.type === 'safety' ? 'bg-sage' :
                          pool.type === 'commons' ? 'bg-[color:var(--accent-gold)]' :
                          'bg-[color:var(--accent-clay)]'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${getPoolProgress(pool)}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="flex justify-between text-xs pt-2">
                      <span className="text-[color:var(--muted)]">APY: {pool.apy}%</span>
                      <span className="text-[color:var(--muted)]">{pool.target - pool.balance} to goal</span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Vault Section */}
          {activeSection === 'vault' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              <div className="up-card p-6 bg-gradient-to-r from-[color:var(--accent-gold)]/20 to-[color:var(--accent-clay)]/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="up-kicker">Total Vault Balance</p>
                    <h2 className="text-4xl font-black tracking-tighter">R 20,000.00</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[color:var(--muted)]">Active Pools</p>
                    <p className="text-2xl font-black">4</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="p-3 bg-[color:var(--surface)] rounded-lg text-center">
                    <p className="text-lg font-black text-sage">R 7,500</p>
                    <p className="text-xs text-[color:var(--muted)]">Safety Net</p>
                  </div>
                  <div className="p-3 bg-[color:var(--surface)] rounded-lg text-center">
                    <p className="text-lg font-black text-[color:var(--accent-gold)]">R 7,500</p>
                    <p className="text-xs text-[color:var(--muted)]">Commons</p>
                  </div>
                  <div className="p-3 bg-[color:var(--surface)] rounded-lg text-center">
                    <p className="text-lg font-black text-[color:var(--accent-clay)]">R 5,000</p>
                    <p className="text-xs text-[color:var(--muted)]">Active</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="up-card p-6">
                  <p className="up-kicker">Collective Liquidity</p>
                  <h3 className="mt-2 text-xl font-black tracking-tighter">R 15,000.00</h3>
                  <div className="mt-4 space-y-3">
                    <HealthMetricBar label="Available" value={75} />
                    <HealthMetricBar label="Locked" value={25} />
                  </div>
                </div>
                <div className="up-card p-6">
                  <p className="up-kicker">Pool Health</p>
                  <div className="mt-4 flex justify-center">
                    <PoolHealthGauge score={87} size="lg" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Credit Section */}
          {activeSection === 'credit' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              <div className="up-card p-6 bg-gradient-to-br from-sage/10 to-transparent">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-sage/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="up-kicker">Credit Gateway</p>
                    <h3 className="text-xl font-black tracking-tighter">Access Collective Credit</h3>
                  </div>
                </div>
                <p className="text-sm text-[color:var(--muted)] mb-6">
                  Leverage your trust score and community standing to access credit lines 
                  backed by the collective. Low interest rates, community-governed terms.
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="p-4 bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)]">
                    <p className="text-xs text-[color:var(--muted)]">Your Limit</p>
                    <p className="text-2xl font-black text-sage">R 15,000</p>
                  </div>
                  <div className="p-4 bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)]">
                    <p className="text-xs text-[color:var(--muted)]">Current Balance</p>
                    <p className="text-2xl font-black">R 0</p>
                  </div>
                  <div className="p-4 bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)]">
                    <p className="text-xs text-[color:var(--muted)]">Interest Rate</p>
                    <p className="text-2xl font-black text-[color:var(--accent-gold)]">8.5%</p>
                  </div>
                </div>
                <button className="mt-6 w-full py-3 bg-[color:var(--accent-sage)] text-white font-black text-sm uppercase rounded-lg hover:bg-[color:var(--accent-sage)]/80 transition-colors">
                  Request Credit
                </button>
              </div>

              <div className="up-card p-6">
                <p className="up-kicker">SME Buying Circles</p>
                <h3 className="mt-2 text-xl font-black tracking-tighter">Group Purchasing Power</h3>
                <p className="mt-3 text-sm text-[color:var(--muted)]">
                  Join with other community members to access bulk discounts and 
                  shared procurement benefits.
                </p>
                <div className="mt-4 space-y-3">
                  <div className="p-4 bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[color:var(--accent-clay)]/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[color:var(--accent-clay)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-black">Energy Cooperative</p>
                        <p className="text-xs text-[color:var(--muted)]">12 members • R2,500 saved</p>
                      </div>
                    </div>
                    <button className="px-3 py-1 text-xs font-black uppercase border border-[color:var(--accent-gold)] text-[color:var(--accent-gold)] rounded-full hover:bg-[color:var(--accent-gold)] hover:text-white transition-colors">
                      Join
                    </button>
                  </div>
                  <div className="p-4 bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[color:var(--accent-gold)]/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[color:var(--accent-gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-black">Office Supplies Circle</p>
                        <p className="text-xs text-[color:var(--muted)]">8 members • R800 saved</p>
                      </div>
                    </div>
                    <button className="px-3 py-1 text-xs font-black uppercase border border-[color:var(--accent-gold)] text-[color:var(--accent-gold)] rounded-full hover:bg-[color:var(--accent-gold)] hover:text-white transition-colors">
                      Join
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Governance Section */}
          {activeSection === 'governance' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              <div className="up-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[color:var(--accent-gold)]/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[color:var(--accent-gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="up-kicker">Collective Governance</p>
                    <h3 className="text-xl font-black tracking-tighter">Democratic Decision Making</h3>
                  </div>
                </div>
                <p className="text-sm text-[color:var(--muted)]">
                  Shape the future of Ubuntu Pools through transparent, community-driven governance.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="up-card p-5 hover:border-[color:var(--accent-gold)]/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 text-xs font-black bg-[color:var(--accent-sage)]/20 text-[color:var(--accent-sage)] rounded">ACTIVE</span>
                  </div>
                  <h4 className="font-black">Proposal #42</h4>
                  <p className="text-sm text-[color:var(--muted)] mt-1">Allocate 10% of commons to solar initiative</p>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-[color:var(--muted)]">12 Yes • 2 No • 3 Abstain</span>
                    <span className="text-[color:var(--accent-sage)]">Passed</span>
                  </div>
                </div>
                <div className="up-card p-5 hover:border-[color:var(--accent-gold)]/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 text-xs font-black bg-[color:var(--accent-gold)]/20 text-[color:var(--accent-gold)] rounded">VOTING</span>
                  </div>
                  <h4 className="font-black">Proposal #43</h4>
                  <p className="text-sm text-[color:var(--muted)] mt-1">Update credit gateway interest rates</p>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-[color:var(--muted)]">3 days remaining</span>
                    <button className="text-[color:var(--accent-gold)] font-black">Vote Now</button>
                  </div>
                </div>
              </div>

              <button className="w-full py-3 border border-[color:var(--accent-gold)] text-[color:var(--accent-gold)] font-black text-sm uppercase rounded-lg hover:bg-[color:var(--accent-gold)] hover:text-white transition-colors">
                + Create Proposal
              </button>
            </motion.div>
          )}

          {/* Integrations Section */}
          {activeSection === 'integrations' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              <div className="up-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="up-kicker">Third-Party Integrations</p>
                    <h2 className="mt-2 text-2xl font-black tracking-tighter">Connected Services</h2>
                  </div>
                  <button className="px-4 py-2 bg-[color:var(--accent-sage)] text-white font-black text-xs uppercase rounded-full hover:bg-[color:var(--accent-sage)]/80 transition-colors">
                    + Add Integration
                  </button>
                </div>
                <p className="text-sm text-[color:var(--muted)]">
                  Connect external services for banking, payments, identity, and analytics. 
                  All integrations are POPIA compliant and secure.
                </p>
              </div>

              {/* Integration Status Overview */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="up-card p-4 text-center">
                  <p className="text-3xl font-black text-sage">
                    {availableIntegrations.filter(i => i.status === 'connected').length}
                  </p>
                  <p className="text-xs text-[color:var(--muted)]">Connected</p>
                </div>
                <div className="up-card p-4 text-center">
                  <p className="text-3xl font-black text-[color:var(--accent-gold)]">
                    {availableIntegrations.filter(i => i.status === 'disconnected').length}
                  </p>
                  <p className="text-xs text-[color:var(--muted)]">Available</p>
                </div>
                <div className="up-card p-4 text-center">
                  <p className="text-3xl font-black text-[color:var(--accent-clay)]">
                    {mockIntegrationAccounts.length}
                  </p>
                  <p className="text-xs text-[color:var(--muted)]">Linked Accounts</p>
                </div>
              </div>

              {/* Connected Bank Accounts */}
              <div className="up-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-sage/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="up-kicker">Bank Accounts</p>
                    <h3 className="text-lg font-black tracking-tighter">Linked via Stitch</h3>
                  </div>
                </div>
                <div className="space-y-3">
                  {mockIntegrationAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)]">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          account.type === 'credit' ? 'bg-[color:var(--accent-clay)]/20' : 'bg-sage/20'
                        }`}>
                          <svg className={`w-5 h-5 ${account.type === 'credit' ? 'text-[color:var(--accent-clay)]' : 'text-sage'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-black text-sm">{account.name}</p>
                          <p className="text-xs text-[color:var(--muted)]">****{account.mask}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-black ${account.balance && account.balance < 0 ? 'text-[color:var(--accent-clay)]' : ''}`}>
                          R{account.balance?.toLocaleString() ?? '0.00'}
                        </p>
                        <p className="text-xs text-[color:var(--muted)] capitalize">{account.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-4 w-full py-2 border border-[color:var(--border)] text-[color:var(--muted)] font-black text-xs uppercase rounded-lg hover:bg-[color:var(--surface-2)] transition-colors">
                  Manage Bank Connections
                </button>
              </div>

              {/* All Integrations Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {availableIntegrations.map((integration) => (
                  <div 
                    key={integration.id} 
                    className={`up-card p-5 ${
                      integration.status === 'connected' 
                        ? 'border-[color:var(--accent-sage)]/30' 
                        : 'opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          integration.color === 'sage' ? 'bg-sage/20 text-sage' :
                          integration.color === 'gold' ? 'bg-[color:var(--accent-gold)]/20 text-[color:var(--accent-gold)]' :
                          'bg-[color:var(--accent-clay)]/20 text-[color:var(--accent-clay)]'
                        }`}>
                          {integration.type === 'bank' && (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          )}
                          {integration.type === 'payment' && (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          {integration.type === 'identity' && (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          )}
                          {integration.type === 'analytics' && (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          )}
                          {integration.type === 'messaging' && (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h4 className="font-black">{integration.name}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            integration.status === 'connected' ? 'bg-sage/20 text-sage' :
                            integration.status === 'pending' ? 'bg-[color:var(--accent-gold)]/20 text-[color:var(--accent-gold)]' :
                            integration.status === 'error' ? 'bg-red-500/20 text-red-500' :
                            'bg-[color:var(--surface)] text-[color:var(--muted)]'
                          }`}>
                            {integration.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-[color:var(--muted)] mb-3">{integration.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {integration.features.slice(0, 3).map((feature, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 bg-[color:var(--surface)] rounded-full text-[color:var(--muted)]">
                          {feature}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-[color:var(--border)]">
                      {integration.status === 'connected' ? (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[color:var(--accent-sage)] animate-pulse" />
                            <span className="text-xs text-[color:var(--muted)]">
                              Last sync: {integration.lastSync ? new Date(integration.lastSync).toLocaleString() : 'N/A'}
                            </span>
                          </div>
                          <button className="text-xs font-black text-[color:var(--accent-gold)] uppercase hover:underline">
                            Configure
                          </button>
                        </>
                      ) : (
                        <button className="w-full py-2 bg-[color:var(--accent-sage)]/10 text-[color:var(--accent-sage)] font-black text-xs uppercase rounded hover:bg-[color:var(--accent-sage)]/20 transition-colors">
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Integration Documentation */}
              <div className="up-card p-6 bg-gradient-to-br from-[color:var(--accent-gold)]/10 to-transparent">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[color:var(--accent-gold)]/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[color:var(--accent-gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="up-kicker">Integration Framework</p>
                    <h3 className="text-lg font-black tracking-tighter">Adding New Providers</h3>
                  </div>
                </div>
                <p className="text-sm text-[color:var(--muted)] mb-4">
                  Ubuntu Pools supports a modular integration framework. New providers can be added by implementing 
                  the standard BankProvider interface. All integrations support POPIA compliance and secure token handling.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="p-3 bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)]">
                    <p className="text-xs font-black text-[color:var(--accent-gold)] mb-1">Required Methods</p>
                    <p className="text-xs text-[color:var(--muted)]">
                      createLinkToken, exchangeToken, getAccounts, getTransactions, refreshConnection, disconnect
                    </p>
                  </div>
                  <div className="p-3 bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)]">
                    <p className="text-xs font-black text-[color:var(--accent-gold)] mb-1">Config Fields</p>
                    <p className="text-xs text-[color:var(--muted)]">
                      clientId, clientSecret, environment, redirectUri per provider configuration
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Core Tools Access */}
          <div className="up-card p-5">
            <p className="up-kicker mb-4">Core Services & Tools</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {coreTools.map((tool) => (
                <Link
                  key={tool.id}
                  href="#"
                  className="flex items-start gap-3 p-3 rounded-lg bg-[color:var(--surface)] border border-[color:var(--border)] hover:border-[color:var(--accent-sage)]/50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    tool.color === 'sage' ? 'bg-sage/20 text-sage' :
                    tool.color === 'gold' ? 'bg-[color:var(--accent-gold)]/20 text-[color:var(--accent-gold)]' :
                    'bg-[color:var(--accent-clay)]/20 text-[color:var(--accent-clay)]'
                  }`}>
                    <ToolIcon icon={tool.icon} className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm">{tool.name}</h4>
                    <p className="text-xs text-[color:var(--muted)]">{tool.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="up-card p-5">
            <p className="up-kicker mb-4">Quick Stats</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[color:var(--surface)] rounded-lg">
                <span className="text-sm text-[color:var(--muted)]">Total Contributions</span>
                <span className="font-black">156</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[color:var(--surface)] rounded-lg">
                <span className="text-sm text-[color:var(--muted)]">Community Impact</span>
                <span className="font-black">2,840</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[color:var(--surface)] rounded-lg">
                <span className="text-sm text-[color:var(--muted)]">Badges Earned</span>
                <span className="font-black text-[color:var(--accent-gold)]">12</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[color:var(--surface)] rounded-lg">
                <span className="text-sm text-[color:var(--muted)]">Trust Rank</span>
                <span className="font-black text-sage">#42</span>
              </div>
            </div>
          </div>

          {/* Integration Status */}
          <div className="up-card p-5">
            <p className="up-kicker mb-4">Connected Services</p>
            <div className="space-y-2">
              {availableIntegrations.filter(i => i.status === 'connected').slice(0, 4).map((integration) => (
                <div key={integration.id} className="flex items-center justify-between p-2 bg-[color:var(--surface)] rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      integration.status === 'connected' ? 'bg-[color:var(--accent-sage)]' : 'bg-[color:var(--muted)]'
                    }`} />
                    <span className="text-xs font-medium">{integration.name}</span>
                  </div>
                  <span className="text-xs text-[color:var(--muted)] capitalize">{integration.type}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setActiveSection('integrations')}
              className="mt-3 w-full py-2 text-xs font-black uppercase text-[color:var(--accent-gold)] hover:bg-[color:var(--accent-gold)]/10 rounded transition-colors"
            >
              Manage Connections
            </button>
          </div>

          {/* Chain Status */}
          <div className="up-card p-5">
            <p className="up-kicker">Ledger Integrity</p>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[color:var(--accent-sage)] animate-pulse" />
              <span className="text-sm font-medium">Hash Chain Verified</span>
            </div>
            <p className="mt-2 text-xs text-[color:var(--muted)]">
              Latest block: #15234 • All transactions immutable
            </p>
          </div>

          {/* Recent Activity */}
          <div className="up-card p-5">
            <p className="up-kicker mb-4">Recent Activity</p>
            <div className="space-y-3">
              {[
                { type: 'CREDIT', desc: 'Safety Net contribution', time: '2h ago', amount: '+R1,000' },
                { type: 'YIELD', desc: 'Yield distribution', time: '1d ago', amount: '+$166.44' },
                { type: 'GOV', desc: 'Proposal #42 passed', time: '2d ago', amount: '' },
                { type: 'POOL', desc: 'Solar Initiative joined', time: '3d ago', amount: '+R500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      item.type === 'CREDIT' ? 'bg-sage/20 text-sage' :
                      item.type === 'YIELD' ? 'bg-[color:var(--accent-gold)]/20 text-[color:var(--accent-gold)]' :
                      item.type === 'GOV' ? 'bg-[color:var(--accent-gold)]/20 text-[color:var(--accent-gold)]' :
                      'bg-[color:var(--accent-clay)]/20 text-[color:var(--accent-clay)]'
                    }`}>
                      {item.type}
                    </span>
                    <span className="text-[color:var(--muted)]">{item.desc}</span>
                  </div>
                  {item.amount && (
                    <span className="font-black text-sage">{item.amount}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
