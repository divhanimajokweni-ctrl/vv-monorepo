// File: packages/dashboard/src/LindiweSpineHealth.tsx
// Purpose: Real-time visualization of the eight-layer Water Spine Health.
// Designed with Kowalski's principles: intentional motion, easing, timing.
// Every panel answers one water infrastructure integrity question with a single glance.

import React, { useEffect, useState } from 'react';

/**
 * Spine layer status
 */
interface LayerHealth {
  layer: number;
  name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  lastCheck: number;
  proof: string;         // What proves this layer is working
  underwriterQuestion: string; // The question this layer answers
}

/**
 * BayWater Triad live metrics
 */
interface TriadMetrics {
  flow_rate_lpm: number;
  pressure_bar: number;
  leak_anomaly_score: number;
  timestamp: number;
}

/**
 * Shadow evaluation summary
 */
interface ShadowSummary {
  totalEvaluated: number;
  divergences: number;
  divergenceRate: number;
  mode: string;
}

/**
 * THE BAYWATER WATER SPINE HEALTH DASHBOARD
 *
 * Design principles:
 * - Intentional motion: Status changes animate smoothly (300ms ease-out)
 * - Easing: Color transitions use cubic-bezier(0.4, 0, 0.2, 1)
 * - Timing: Data refreshes every 15s, pulses subtly on update
 *
 * Eight panels, one per water integrity layer.
 * Plus BayWater Triad metrics panel.
 * Plus Shadow evaluation panel.
 */
const LindiweSpineHealth: React.FC = () => {
  const [layers, setLayers] = useState<LayerHealth[]>([]);
  const [triad, setTriad] = useState<TriadMetrics | null>(null);
  const [shadow, setShadow] = useState<ShadowSummary | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [pulse, setPulse] = useState<boolean>(false);

  /**
   * Fetch spine health every 15 seconds
   */
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch('/api/spine-health');
        const data = await response.json();
        setLayers(data.layers);
        setTriad(data.triad);
        setShadow(data.shadow);
        setLastRefresh(Date.now());
        setPulse(true);
        setTimeout(() => setPulse(false), 300);
      } catch (error) {
        console.error('Spine health fetch failed:', error);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'HEALTHY': return '#16a34a';
      case 'DEGRADED': return '#d97706';
      case 'CRITICAL': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'HEALTHY': return '🛡️';
      case 'DEGRADED': return '⚠️';
      case 'CRITICAL': return '🚨';
      default: return '❓';
    }
  };

  const formatTime = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const formatUptime = (bps: number): string => {
    return `${(bps / 100).toFixed(2)}%`;
  };

  const formatCurrency = (cents: number): string => {
    return `R${(cents / 100).toFixed(2)}`;
  };

  return (
    <div style={{
      padding: '2rem',
      background: '#0a0a0f',
      minHeight: '100vh',
      color: '#d0d0dc',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        padding: '1rem 1.5rem',
        background: '#111118',
        borderRadius: '12px',
        border: '1px solid #2a2a35',
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#e8e8f4', fontSize: '1.8rem' }}>
            💧 BayWater Spine Health
          </h1>
          <p style={{ margin: '0.3rem 0 0', color: '#8b8b9a', fontSize: '0.9rem' }}>
            Eight-layer Water Integrity Spine · Continuous Proof of Infrastructure Safety
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '0.8rem',
            color: '#8b8b9a',
            transition: 'opacity 300ms ease-out',
            opacity: pulse ? 0.6 : 1,
          }}>
            Last refresh: {formatTime(lastRefresh)}
          </div>
          <div style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: layers.every(l => l.status === 'HEALTHY') ? '#16a34a' : '#d97706',
            marginLeft: '0.5rem',
            animation: pulse ? 'pulse 300ms ease-out' : 'none',
          }} />
        </div>
      </header>

      {/* Eight-Layer Spine Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        {layers.map((layer) => (
          <div
            key={layer.layer}
            style={{
              background: '#111118',
              border: `1px solid ${getStatusColor(layer.status)}40`,
              borderRadius: '10px',
              padding: '1.2rem',
              transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              borderLeft: `4px solid ${getStatusColor(layer.status)}`,
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '0.8rem',
            }}>
              <div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#8b8b9a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Layer {layer.layer}
                </div>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: '#e8e8f4',
                  marginTop: '0.2rem',
                }}>
                  {getStatusIcon(layer.status)} {layer.name}
                </div>
              </div>
              <div style={{
                padding: '0.2rem 0.6rem',
                borderRadius: '20px',
                background: `${getStatusColor(layer.status)}20`,
                color: getStatusColor(layer.status),
                fontSize: '0.75rem',
                fontWeight: 600,
              }}>
                {layer.status}
              </div>
            </div>

            <div style={{
              fontSize: '0.8rem',
              color: '#6b6b7a',
              marginBottom: '0.5rem',
              fontStyle: 'italic',
            }}>
              "{layer.underwriterQuestion}"
            </div>

            <div style={{
              fontSize: '0.75rem',
              color: '#5b5b6a',
              fontFamily: 'monospace',
              background: '#0a0a0f',
              padding: '0.4rem 0.6rem',
              borderRadius: '4px',
            }}>
              Proof: {layer.proof}
            </div>

            <div style={{
              fontSize: '0.7rem',
              color: '#4b4b5a',
              marginTop: '0.5rem',
            }}>
              Checked {formatTime(layer.lastCheck)}
            </div>
          </div>
        ))}
      </div>

      {/* BayWater Triad Panel */}
      {triad && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '2rem',
        }}>
          <div style={metricPanelStyle(triad.flow_rate_lpm >= 100)}>
            <div style={metricLabelStyle}>Flow Rate</div>
            <div style={metricValueStyle}>{triad.flow_rate_lpm} LPM</div>
            <div style={metricThresholdStyle}>Threshold: ≥100 LPM</div>
            <div style={metricStatusStyle(triad.flow_rate_lpm >= 100)}>
              {triad.flow_rate_lpm >= 100 ? '✅ Adequate Flow' : '🚨 LOW FLOW'}
            </div>
          </div>

          <div style={metricPanelStyle(triad.pressure_bar >= 2.0)}>
            <div style={metricLabelStyle}>Pressure</div>
            <div style={metricValueStyle}>{triad.pressure_bar} bar</div>
            <div style={metricThresholdStyle}>Threshold: ≥2.0 bar</div>
            <div style={metricStatusStyle(triad.pressure_bar >= 2.0)}>
              {triad.pressure_bar >= 2.0 ? '✅ Adequate Pressure' : '⚠️ LOW PRESSURE'}
            </div>
          </div>

          <div style={metricPanelStyle(triad.leak_anomaly_score <= 0.8)}>
            <div style={metricLabelStyle}>Leak Detection</div>
            <div style={metricValueStyle}>{(triad.leak_anomaly_score * 100).toFixed(1)}%</div>
            <div style={metricThresholdStyle}>Threshold: ≤80%</div>
            <div style={metricStatusStyle(triad.leak_anomaly_score <= 0.8)}>
              {triad.leak_anomaly_score <= 0.8 ? '✅ No Leak Detected' : '🚨 LEAK ALERT'}
            </div>
          </div>
        </div>
      )}

      {/* Shadow Evaluation Panel */}
      {shadow && (
        <div style={{
          background: '#111118',
          border: `1px solid ${shadow.divergences === 0 ? '#16a34a40' : '#dc262640'}`,
          borderRadius: '10px',
          padding: '1.2rem',
          borderLeft: `4px solid ${shadow.divergences === 0 ? '#16a34a' : '#dc2626'}`,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.8rem',
          }}>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#e8e8f4' }}>
                🕶️ Shadow Evaluation
              </div>
              <div style={{ fontSize: '0.8rem', color: '#8b8b9a' }}>
                Mode: {shadow.mode} · Continuous proof of correctness
              </div>
            </div>
            <div style={{
              padding: '0.4rem 1rem',
              borderRadius: '20px',
              background: shadow.divergences === 0 ? '#16a34a20' : '#dc262620',
              color: shadow.divergences === 0 ? '#16a34a' : '#dc2626',
              fontWeight: 700,
              fontSize: '1.2rem',
            }}>
              {shadow.divergences === 0 ? '✅ CLEAN' : `🚨 ${shadow.divergences} DIVERGENCES`}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#6b6b7a' }}>Total Evaluated</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#e8e8f4' }}>
                {shadow.totalEvaluated.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#6b6b7a' }}>Divergence Rate</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#e8e8f4' }}>
                {(shadow.divergenceRate * 100).toFixed(4)}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#6b6b7a' }}>Deployment Blocked</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: shadow.divergences > 0 ? '#dc2626' : '#16a34a' }}>
                {shadow.divergences > 0 ? 'YES' : 'NO'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        marginTop: '2rem',
        padding: '1rem',
        textAlign: 'center',
        color: '#4b4b5a',
        fontSize: '0.75rem',
        borderTop: '1px solid #2a2a35',
      }}>
        BayWater Services · Water Spine Health v1.0 ·
        "Make every infrastructure failure legible now."
      </footer>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// ── Style helpers ──

const metricPanelStyle = (healthy: boolean): React.CSSProperties => ({
  background: '#111118',
  border: `1px solid ${healthy ? '#16a34a40' : '#dc262640'}`,
  borderRadius: '10px',
  padding: '1.2rem',
  borderLeft: `4px solid ${healthy ? '#16a34a' : '#dc2626'}`,
  transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
});

const metricLabelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#8b8b9a',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.3rem',
};

const metricValueStyle: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 700,
  color: '#e8e8f4',
  marginBottom: '0.3rem',
};

const metricThresholdStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#6b6b7a',
  marginBottom: '0.3rem',
};

const metricStatusStyle = (healthy: boolean): React.CSSProperties = ({
  fontSize: '0.8rem',
  fontWeight: 600,
  color: healthy ? '#16a34a' : '#dc2626',
});

export default LindiweSpineHealth;