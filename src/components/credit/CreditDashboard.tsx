'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export interface CreditPoolState {
  poolId: string;
  phase: 'phase1_formation' | 'phase2_microcredit' | 'phase3_scaling';
  creditActivated: boolean;
  poolHealthScore: number;
  safetyBuffer: number;
  totalPoolCapital: number;
  activeCreditExposure: number;
  bufferRatio: number;
}

export interface CreditMemberProfile {
  memberId: string;
  ubuntuScore: number;
  creditLimit: number;
  availableCredit: number;
  activeLoans: number;
  onTimeRepaymentRate: number;
}

export interface CreditLoan {
  loanId: string;
  principal: number;
  totalDue: number;
  amountPaid: number;
  dueDate: string;
  status: 'pending' | 'active' | 'repaid' | 'defaulted';
  creditType: 'microcredit' | 'standard' | 'extended';
}

interface CreditDashboardProps {
  poolState: CreditPoolState;
  memberProfile?: CreditMemberProfile;
  loans?: CreditLoan[];
}

const phaseLabels = {
  phase1_formation: 'Capital Formation',
  phase2_microcredit: 'Microcredit',
  phase3_scaling: 'Adaptive Scaling',
};

const phaseDescriptions = {
  phase1_formation: 'Building safety buffer before lending begins',
  phase2_microcredit: 'Controlled short-term microcredit available',
  phase3_scaling: 'Full lending with health-based rewards',
};

export function CreditDashboard({ poolState, memberProfile, loans = [] }: CreditDashboardProps) {
  const [showLoanForm, setShowLoanForm] = useState(false);

  const healthColor = poolState.poolHealthScore >= 85 
    ? 'text-emerald-400' 
    : poolState.poolHealthScore >= 70 
    ? 'text-amber-400' 
    : 'text-red-400';

  const phaseColor = poolState.phase === 'phase3_scaling'
    ? 'bg-emerald-500/20 text-emerald-300'
    : poolState.phase === 'phase2_microcredit'
    ? 'bg-amber-500/20 text-amber-300'
    : 'bg-slate-500/20 text-slate-300';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Credit Facilities</h3>
          <p className="text-sm text-slate-400">Pool Health & Ubuntu Score Lending</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${phaseColor}`}>
          {phaseLabels[poolState.phase]}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="up-card p-4">
          <p className="up-kicker text-xs">Pool Health</p>
          <div className={`text-3xl font-black ${healthColor}`}>
            {poolState.poolHealthScore}%
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {phaseDescriptions[poolState.phase]}
          </p>
        </div>

        <div className="up-card p-4">
          <p className="up-kicker text-xs">Safety Buffer</p>
          <div className="text-3xl font-black text-white">
            {(poolState.safetyBuffer / 100).toLocaleString()}
          </div>
          <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(poolState.bufferRatio, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Buffer ratio: {poolState.bufferRatio}%
          </p>
        </div>
      </div>

      {poolState.creditActivated && memberProfile && (
        <div className="up-card p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="up-kicker text-xs">Your Credit</p>
            <span className="text-xs text-slate-400">
              Ubuntu Score: {memberProfile.ubuntuScore}
            </span>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">Credit Limit</p>
              <p className="text-lg font-bold text-white">
                {(memberProfile.creditLimit / 100).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Available</p>
              <p className="text-lg font-bold text-emerald-400">
                {(memberProfile.availableCredit / 100).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Repayment Rate</p>
              <p className="text-lg font-bold text-white">
                {memberProfile.onTimeRepaymentRate}%
              </p>
            </div>
          </div>

          {loans.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-500 mb-2">Active Loans</p>
              {loans.map(loan => (
                <div key={loan.loanId} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm text-white">{loan.creditType}</p>
                    <p className="text-xs text-slate-500">
                      Due: {new Date(loan.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white">
                      {(loan.amountPaid / 100).toLocaleString()} / {(loan.totalDue / 100).toLocaleString()}
                    </p>
                    <p className={`text-xs ${loan.status === 'repaid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {loan.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {poolState.phase !== 'phase1_formation' && (
            <button
              onClick={() => setShowLoanForm(!showLoanForm)}
              className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Request Credit
            </button>
          )}
        </div>
      )}

      {!poolState.creditActivated && (
        <div className="up-card p-4 border border-slate-700">
          <p className="text-sm text-slate-400">
            Credit facilities are being prepared. The pool is in the capital formation phase to build the safety buffer before lending begins.
          </p>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Safety Buffer Progress</span>
              <span>{poolState.bufferRatio}% / 25% target</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-amber-500"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(poolState.bufferRatio * 4, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        {poolState.phase === 'phase2_microcredit' && (
          <div className="up-card p-3 border border-amber-500/30">
            <p className="text-xs text-amber-400 font-medium">Microcredit Active</p>
            <p className="text-xs text-slate-400 mt-1">
              Short-term loans up to 10% of contributions
            </p>
          </div>
        )}
        {poolState.phase === 'phase3_scaling' && (
          <>
            <div className="up-card p-3 border border-emerald-500/30">
              <p className="text-xs text-emerald-400 font-medium">Health Rewards</p>
              <p className="text-xs text-slate-400 mt-1">
                Pool health ≥85% = lower rates
              </p>
            </div>
            <div className="up-card p-3 border border-emerald-500/30">
              <p className="text-xs text-emerald-400 font-medium">Scaling Active</p>
              <p className="text-xs text-slate-400 mt-1">
                Credit limits increase with health
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
