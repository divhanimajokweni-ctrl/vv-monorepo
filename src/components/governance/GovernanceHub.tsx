'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  proposerTrustScore: number;
  status: 'active' | 'passed' | 'rejected';
  votes: { approve: number; reject: number };
  votingEnds: string;
}

interface GovernanceHubProps {
  proposals: Proposal[];
  userTrustScore: number;
}

export function GovernanceHub({ proposals, userTrustScore }: GovernanceHubProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'passed' | 'rejected'>('active');
  
  const filteredProposals = proposals.filter(p => p.status === activeTab);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Governance Hub</h2>
        <TrustScoreBadge score={userTrustScore} />
      </div>

      <div className="flex gap-2">
        {(['active', 'passed', 'rejected'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-purple-600 text-white'
                : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-3"
        >
          {filteredProposals.length === 0 ? (
            <EmptyState status={activeTab} />
          ) : (
            filteredProposals.map(proposal => (
              <ProposalCard key={proposal.id} proposal={proposal} userScore={userTrustScore} />
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {activeTab === 'active' && (
        <CreateProposalButton canCreate={userTrustScore >= 25} />
      )}
    </div>
  );
}

function TrustScoreBadge({ score }: { score: number }) {
  const getLevel = (s: number) => {
    if (s >= 90) return { label: 'Archivist', color: 'bg-purple-500' };
    if (s >= 75) return { label: 'Elder', color: 'bg-yellow-500' };
    if (s >= 50) return { label: 'Trusted', color: 'bg-green-500' };
    if (s >= 25) return { label: 'Contributor', color: 'bg-blue-500' };
    return { label: 'Novice', color: 'bg-gray-500' };
  };

  const level = getLevel(score);

  return (
    <div className="flex items-center gap-2 bg-neutral-800 rounded-full px-3 py-1">
      <div className={`w-2 h-2 rounded-full ${level.color}`} />
      <span className="text-sm font-medium text-white">{level.label}</span>
      <span className="text-xs text-neutral-400">({score})</span>
    </div>
  );
}

function ProposalCard({ proposal, userScore }: { proposal: Proposal; userScore: number }) {
  const totalVotes = proposal.votes.approve + proposal.votes.reject;
  const approvalRate = totalVotes > 0 ? proposal.votes.approve / totalVotes : 0;
  const canVote = userScore >= 25;

  return (
    <motion.div
      className="bg-neutral-800 rounded-xl p-4 border border-neutral-700"
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-white">{proposal.title}</h3>
          <p className="text-sm text-neutral-400 mt-1">{proposal.description}</p>
        </div>
        <StatusBadge status={proposal.status} />
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-neutral-400">Proposed by</span>
          <TrustScoreBadge score={proposal.proposerTrustScore} />
        </div>
        <div className="text-neutral-500">
          Ends {new Date(proposal.votingEnds).toLocaleDateString()}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-green-400">{proposal.votes.approve} approve</span>
          <span className="text-red-400">{proposal.votes.reject} reject</span>
        </div>
        <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 to-green-400"
            initial={{ width: 0 }}
            animate={{ width: `${approvalRate * 100}%` }}
          />
        </div>
      </div>

      {canVote && proposal.status === 'active' && (
        <div className="mt-4 flex gap-2">
          <VoteButton type="approve" />
          <VoteButton type="reject" />
        </div>
      )}
    </motion.div>
  );
}

function VoteButton({ type }: { type: 'approve' | 'reject' }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`flex-1 py-2 rounded-lg text-sm font-medium ${
        type === 'approve'
          ? 'bg-green-600 hover:bg-green-500 text-white'
          : 'bg-red-600 hover:bg-red-500 text-white'
      }`}
    >
      {type === 'approve' ? 'Vote Approve' : 'Vote Reject'}
    </motion.button>
  );
}

function StatusBadge({ status }: { status: Proposal['status'] }) {
  const colors = {
    active: 'bg-blue-500',
    passed: 'bg-green-500',
    rejected: 'bg-red-500',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium text-white ${colors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function EmptyState({ status }: { status: string }) {
  const messages = {
    active: 'No active proposals. Be the first to propose change!',
    passed: 'No passed proposals yet.',
    rejected: 'No rejected proposals.',
  };

  return (
    <div className="text-center py-12 text-neutral-500">
      <div className="text-4xl mb-4">📋</div>
      <p>{messages[status as keyof typeof messages]}</p>
    </div>
  );
}

function CreateProposalButton({ canCreate }: { canCreate: boolean }) {
  return (
    <motion.button
      whileHover={canCreate ? { scale: 1.02 } : {}}
      whileTap={canCreate ? { scale: 0.98 } : {}}
      disabled={!canCreate}
      className={`w-full py-4 rounded-xl font-medium ${
        canCreate
          ? 'bg-purple-600 hover:bg-purple-500 text-white'
          : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
      }`}
    >
      {canCreate ? '+ Create New Proposal' : `Need 25+ trust score to create proposals (you have less)`}
    </motion.button>
  );
}
