import React from 'react';

export function VillageCircle({ villageId, onNavigate }: { villageId: string; onNavigate?: (view: any) => void }) {
  return <div className="village-circle">Village: {villageId}</div>;
}

export function CircularProtocol({ protocolId, members, currentUserId }: { protocolId: string; members?: any[]; currentUserId?: string }) {
  return <div className="circular-protocol">Protocol: {protocolId} - {members?.length} members, current: {currentUserId}</div>;
}

export function PoolView({ poolId }: { poolId: string }) {
  return <div className="pool-view">Pool: {poolId}</div>;
}

export function BufferStatusCard({ poolId, currentBuffer, targetBuffer, protectionLevel }: { poolId: string; currentBuffer?: number; targetBuffer?: number; protectionLevel?: string }) {
  return <div className="buffer-status-card">Buffer: {poolId} - {currentBuffer}/{targetBuffer} ({protectionLevel})</div>;
}

export function YieldCard({ poolId, principal, apy, daysActive }: { poolId: string; principal?: number; apy?: number; daysActive?: number }) {
  return <div className="yield-card">Yield: {poolId} - {principal}@{apy}% ({daysActive} days)</div>;
}

export function CommonsVault({ vaultId, currentAmount, maxAmount }: { vaultId: string; currentAmount?: number; maxAmount?: number }) {
  return <div className="commons-vault">Vault: {vaultId} - {currentAmount}/{maxAmount}</div>;
}

export function ThePulse() {
  return <div className="the-pulse">Pulse</div>;
}

export function TribalImpactDashboard({ villageId }: { villageId: string }) {
  return <div className="tribal-impact-dashboard">Dashboard: {villageId}</div>;
}

export default {
  VillageCircle,
  CircularProtocol,
  PoolView,
  YieldCard,
  BufferStatusCard,
  ThePulse,
  TribalImpactDashboard,
  CommonsVault,
};