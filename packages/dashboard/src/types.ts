/**
 * Spine layer status
 */
export interface LayerHealth {
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
export interface TriadMetrics {
  flow_rate_lpm: number;
  pressure_bar: number;
  leak_anomaly_score: number;
  timestamp: number;
}

/**
 * Shadow evaluation summary
 */
export interface ShadowSummary {
  totalEvaluated: number;
  divergences: number;
  divergenceRate: number;
  mode: string;
}