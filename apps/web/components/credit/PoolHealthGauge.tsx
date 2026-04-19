export function PoolHealthGauge({ poolId, score, size }: { poolId?: string; score?: number; size?: string }) {
  return <div className="pool-health-gauge">
    {poolId ? `Pool: ${poolId}` : `Score: ${score} Size: ${size}`}
  </div>;
}

export function HealthMetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="health-metric-bar">
      <span>{label}: {value}%</span>
      <div style={{ width: `${value}%`, background: 'green', height: '10px' }} />
    </div>
  );
}