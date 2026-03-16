'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/shell/AppShell';
import { ImmutableLedger, type LedgerEvent } from '@/components/ledger/ImmutableLedger';
import { PoolHealthGauge } from '@/components/credit/PoolHealthGauge';

const mockLedgerEvents: LedgerEvent[] = [
  {
    id: 'evt-001',
    eventType: 'CREDIT',
    actorId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    entityId: 'pool-001',
    entityType: 'pool',
    payload: { amount: 1000, currency: 'USDC', source: 'contribution' },
    occurredAt: '2026-02-28T10:30:00Z',
    sequenceNo: 15234,
    hash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12',
    prevHash: 'b2c3d4e5f67890123456789012345678901bcdef1234567890abcdef123',
  },
  {
    id: 'evt-002',
    eventType: 'DEBIT',
    actorId: 'b2c3d4e5-f678-9012-3456-789012345678',
    entityId: 'pool-001',
    entityType: 'pool',
    payload: { amount: 250, currency: 'USDC', destination: 'community-solar', description: 'Buffer Allocation: Community Solar Project' },
    occurredAt: '2026-02-27T14:15:00Z',
    sequenceNo: 15233,
    hash: 'c3d4e5f678901234567890123456789012bcdef1234567890abcdef1234',
    prevHash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12',
  },
  {
    id: 'evt-003',
    eventType: 'CREDIT',
    actorId: 'c4d5e6f7-8901-2345-6789-012345678901',
    entityId: 'pool-001',
    entityType: 'pool',
    payload: { amount: 150, currency: 'USDC', source: 'yield', description: 'Yield Distribution: Q1 2026' },
    occurredAt: '2026-02-26T09:00:00Z',
    sequenceNo: 15232,
    hash: 'd4e5f6789012345678901234567890123cdef1234567890abcdef12345',
    prevHash: 'c3d4e5f678901234567890123456789012bcdef1234567890abcdef1234',
  },
  {
    id: 'evt-004',
    eventType: 'GOVERNANCE',
    actorId: 'd5e6f789-0123-4567-8901-234567890123',
    entityId: 'proposal-042',
    entityType: 'proposal',
    payload: { action: 'vote', outcome: 'passed', votes: { yes: 12, no: 2, abstain: 3 } },
    occurredAt: '2026-02-25T18:45:00Z',
    sequenceNo: 15231,
    hash: 'e5f67890123456789012345678901234def1234567890abcdef123456',
    prevHash: 'd4e5f6789012345678901234567890123cdef1234567890abcdef12345',
  },
  {
    id: 'evt-005',
    eventType: 'REPUTATION',
    actorId: 'e6f78901-2345-6789-0123-456789012345',
    entityId: 'member-007',
    entityType: 'member',
    payload: { badge: 'Knowledge Keeper', awardedBy: 'member-002' },
    occurredAt: '2026-02-24T11:20:00Z',
    sequenceNo: 15230,
    hash: 'f678901234567890123456789012345ef1234567890abcdef1234567',
    prevHash: 'e5f67890123456789012345678901234def1234567890abcdef123456',
  },
];

type LedgerViewMode = 'portal' | 'verification' | 'analytics';

export default function LedgerPage() {
  const [viewMode, setViewMode] = useState<LedgerViewMode>('portal');
  const [showReversals, setShowReversals] = useState(true);

  const verifyHash = (event: LedgerEvent) => {
    console.log('Verifying hash for event:', event.id);
    return true;
  };

  const getEventSummary = () => {
    const credits = mockLedgerEvents.filter(e => e.eventType === 'CREDIT').length;
    const debits = mockLedgerEvents.filter(e => e.eventType === 'DEBIT').length;
    const governance = mockLedgerEvents.filter(e => e.eventType === 'GOVERNANCE').length;
    return { credits, debits, governance, total: mockLedgerEvents.length };
  };

  const summary = getEventSummary();

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <div className="up-card up-border-gradient p-6">
            <p className="up-kicker">Transparency Portal</p>
            <h1 className="mt-2 text-3xl font-black tracking-tighter">
              The Ledger
            </h1>
            <p className="mt-3 text-sm text-[color:var(--muted)]">
              An append-only event stream with hash chain integrity. Every action is recorded, 
              every transaction transparent.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <button
              onClick={() => setViewMode('portal')}
              className={
                viewMode === 'portal'
                  ? 'up-pill border-[color:var(--accent-gold)] text-[color:var(--text)]'
                  : 'up-pill opacity-85 hover:opacity-100'
              }
            >
              Transaction Stream
            </button>
            <button
              onClick={() => setViewMode('verification')}
              className={
                viewMode === 'verification'
                  ? 'up-pill border-[color:var(--accent-gold)] text-[color:var(--text)]'
                  : 'up-pill opacity-85 hover:opacity-100'
              }
            >
              Hash Verification
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={
                viewMode === 'analytics'
                  ? 'up-pill border-[color:var(--accent-gold)] text-[color:var(--text)]'
                  : 'up-pill opacity-85 hover:opacity-100'
              }
            >
              Analytics
            </button>
          </div>

          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-8"
          >
            {viewMode === 'portal' && (
              <ImmutableLedger 
                events={mockLedgerEvents} 
                onVerifyHash={verifyHash}
              />
            )}
            {viewMode === 'verification' && (
              <div className="up-card p-6">
                <p className="up-kicker">Hash Chain Verification</p>
                <h3 className="mt-2 text-xl font-black tracking-tighter">Verify Ledger Integrity</h3>
                <p className="mt-3 text-sm text-[color:var(--muted)]">
                  Each event contains a SHA-256 hash that includes the previous hash, creating an 
                  immutable chain. Verify any entry to ensure no tampering has occurred.
                </p>
                <div className="mt-6 p-4 bg-[color:var(--surface-2)] rounded-lg">
                  <p className="text-sm font-mono text-[color:var(--muted)]">
                    Click &ldquo;Verify Integrity&rdquo; on any event to check the hash chain continuity.
                  </p>
                </div>
              </div>
            )}
            {viewMode === 'analytics' && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="up-card p-6">
                  <p className="up-kicker">Event Distribution</p>
                  <div className="mt-6 flex justify-center">
                    <PoolHealthGauge score={Math.round((summary.credits / summary.total) * 100)} size="lg" />
                  </div>
                  <p className="mt-4 text-center text-sm text-[color:var(--muted)]">
                    Credit events vs total
                  </p>
                </div>
                <div className="up-card p-6">
                  <p className="up-kicker">Activity Summary</p>
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[color:var(--muted)]">Total Events</span>
                      <span className="text-xl font-black">{summary.total}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[color:var(--muted)]">Credit Events</span>
                      <span className="text-xl font-black text-[color:var(--accent-sage)]">{summary.credits}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[color:var(--muted)]">Debit Events</span>
                      <span className="text-xl font-black text-[color:var(--accent-clay)]">{summary.debits}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[color:var(--muted)]">Governance Events</span>
                      <span className="text-xl font-black text-[color:var(--accent-gold)]">{summary.governance}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        <div className="space-y-6">
          <div className="up-card p-6 bg-gradient-to-br from-sage/20 to-transparent border-sage/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-sage/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="up-kicker">Safety Buffer</p>
                <p className="text-2xl font-black text-sage">R 2,300.00</p>
              </div>
            </div>
            <p className="text-xs text-[color:var(--muted)]">
              Your protective reserve is fully funded. This shields your credit eligibility from market volatility.
            </p>
          </div>

          <div className="up-card p-6">
            <p className="up-kicker">Genesis Block</p>
            <h3 className="mt-2 text-lg font-black tracking-tighter">Chain Status</h3>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[color:var(--accent-sage)] animate-pulse" />
              <span className="text-sm font-medium">Integrity Verified</span>
            </div>
          </div>

          <div className="up-card p-6">
            <p className="up-kicker">Latest Activity</p>
            <div className="mt-4 space-y-3">
              {mockLedgerEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      event.eventType === 'CREDIT' ? 'bg-[color:var(--accent-sage)]/20 text-[color:var(--accent-sage)]' :
                      event.eventType === 'DEBIT' ? 'bg-[color:var(--accent-clay)]/20 text-[color:var(--accent-clay)]' :
                      'bg-[color:var(--accent-gold)]/20 text-[color:var(--accent-gold)]'
                    }`}>
                      {event.eventType}
                    </span>
                    <span className="text-[color:var(--muted)]">
                      {new Date(event.occurredAt).toLocaleDateString()}
                    </span>
                  </div>
                  {'description' in event.payload && (
                    <p className="text-[color:var(--muted)] truncate">
                      {String(event.payload.description)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="up-card p-6">
            <p className="up-kicker">Ubuntu Accord</p>
            <h3 className="mt-2 text-lg font-black tracking-tighter">Trust Layer</h3>
            <p className="mt-3 text-xs text-[color:var(--muted)]">
              All transactions are recorded with full transparency. The community governs 
              through consensus.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
