import React from 'react';

export function VillageCircle({ villageId }: { villageId: string }) {
  return <div className="village-circle">Village: {villageId}</div>;
}

export function CircularProtocol({ protocolId }: { protocolId: string }) {
  return <div className="circular-protocol">Protocol: {protocolId}</div>;
}

export function PoolView({ poolId }: { poolId: string }) {
  return <div className="pool-view">Pool: {poolId}</div>;
}

export function YieldCard({ poolId }: { poolId: string }) {
  return <div className="yield-card">Yield: {poolId}</div>;
}

export function BufferStatusCard({ poolId }: { poolId: string }) {
  return <div className="buffer-status-card">Buffer: {poolId}</div>;
}

export function ThePulse() {
  return <div className="the-pulse">Pulse</div>;
}

export function TribalImpactDashboard({ villageId }: { villageId: string }) {
  return <div className="tribal-impact-dashboard">Dashboard: {villageId}</div>;
}

export function CommonsVault({ vaultId }: { vaultId: string }) {
  return <div className="commons-vault">Vault: {vaultId}</div>;
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