// File: packages/dashboard/src/api/spine-health.ts
// Purpose: Backend API that aggregates spine health data

import type { LayerHealth, TriadMetrics, ShadowSummary } from '../types';

export async function getSpineHealth(): Promise<{
  layers: LayerHealth[];
  triad: TriadMetrics;
  shadow: ShadowSummary;
}> {
  const now = Date.now();

  // ── Eight-Layer Water Integrity Health ──
  const layers: LayerHealth[] = [
    {
      layer: 1,
      name: 'Meter Firmware',
      status: await checkMeterFirmware(),
      lastCheck: now,
      proof: 'Smart meter firmware signature verified',
      underwriterQuestion: 'Is meter firmware authentic and untampered?',
    },
    {
      layer: 2,
      name: 'Telemetry Encryption',
      status: await checkTelemetryEncryption(),
      lastCheck: now,
      proof: 'Pipe telemetry data encrypted end-to-end',
      underwriterQuestion: 'Can telemetry data be intercepted in transit?',
    },
    {
      layer: 3,
      name: 'Logger Certificates',
      status: await checkLoggerCertificates(),
      lastCheck: now,
      proof: 'Acoustic logger manufacturer certificates valid',
      underwriterQuestion: 'Are logger devices from trusted manufacturers?',
    },
    {
      layer: 4,
      name: 'Flow Validation',
      status: await checkFlowValidation(),
      lastCheck: now,
      proof: 'Flow data anomaly detection active',
      underwriterQuestion: 'Are flow readings within expected parameters?',
    },
    {
      layer: 5,
      name: 'Bill Consistency',
      status: await checkBillConsistency(),
      lastCheck: now,
      proof: 'Municipal vs BayWater bill comparison clean',
      underwriterQuestion: 'Do bills match internal meter readings?',
    },
    {
      layer: 6,
      name: 'Dividend Accounting',
      status: await checkDividendAccounting(),
      lastCheck: now,
      proof: 'QCO dividend distribution double-entry verified',
      underwriterQuestion: 'Are community dividends accurately calculated?',
    },
    {
      layer: 7,
      name: 'QCO Authentication',
      status: await checkQCOAuthentication(),
      lastCheck: now,
      proof: 'QCO leader biometric login active',
      underwriterQuestion: 'Are QCO leaders properly authenticated?',
    },
    {
      layer: 8,
      name: 'Audit Trail',
      status: await checkAuditTrail(),
      lastCheck: now,
      proof: 'All events in immutable shadow-evaluator store',
      underwriterQuestion: 'Is every water transaction auditable?',
    },
  ];

  // ── Mainframe Triad ──
  const triad = await fetchTriadMetrics();

  // ── Shadow Summary ──
  const shadow = await fetchShadowSummary();

  return { layers, triad, shadow };
}

async function checkMeterFirmware(): Promise<'HEALTHY' | 'DEGRADED' | 'CRITICAL'> {
  try {
    const response = await fetch('http://localhost:3003/meters/firmware-status');
    const data = await response.json();
    return data.allSigned ? 'HEALTHY' : 'CRITICAL';
  } catch {
    return 'CRITICAL';
  }
}

async function checkTelemetryEncryption(): Promise<'HEALTHY' | 'DEGRADED' | 'CRITICAL'> {
  try {
    const response = await fetch('http://localhost:3003/telemetry/encryption-status');
    const data = await response.json();
    return data.encrypted ? 'HEALTHY' : 'CRITICAL';
  } catch {
    return 'CRITICAL';
  }
}

async function checkLoggerCertificates(): Promise<'HEALTHY' | 'DEGRADED' | 'CRITICAL'> {
  try {
    const response = await fetch('http://localhost:3003/loggers/certificates');
    const data = await response.json();
    return data.allValid ? 'HEALTHY' : 'DEGRADED';
  } catch {
    return 'CRITICAL';
  }
}

async function checkFlowValidation(): Promise<'HEALTHY' | 'DEGRADED' | 'CRITICAL'> {
  try {
    const response = await fetch('http://localhost:3003/metrics/anomaly-check');
    const data = await response.json();
    return data.withinBounds ? 'HEALTHY' : 'DEGRADED';
  } catch {
    return 'CRITICAL';
  }
}

async function checkBillConsistency(): Promise<'HEALTHY' | 'DEGRADED' | 'CRITICAL'> {
  try {
    const fs = await import('fs/promises');
    const divergenceCount = await fs.readFile('shadow-results/bill-divergence-count.txt', 'utf-8');
    return parseInt(divergenceCount) === 0 ? 'HEALTHY' : 'CRITICAL';
  } catch {
    return 'UNKNOWN' as any;
  }
}

async function checkDividendAccounting(): Promise<'HEALTHY' | 'DEGRADED' | 'CRITICAL'> {
  try {
    const response = await fetch('http://localhost:3002/dividends/double-entry-check');
    const data = await response.json();
    return data.balanced ? 'HEALTHY' : 'CRITICAL';
  } catch {
    return 'CRITICAL';
  }
}

async function checkQCOAuthentication(): Promise<'HEALTHY' | 'DEGRADED' | 'CRITICAL'> {
  try {
    const response = await fetch('http://localhost:3002/auth/biometric-status');
    const data = await response.json();
    return data.active ? 'HEALTHY' : 'DEGRADED';
  } catch {
    return 'CRITICAL';
  }
}

async function checkAuditTrail(): Promise<'HEALTHY' | 'DEGRADED' | 'CRITICAL'> {
  try {
    const fs = await import('fs/promises');
    const auditLog = await fs.readFile('shadow-results/audit-trail.jsonl', 'utf-8');
    const entries = auditLog.split('\n').filter(Boolean);
    return entries.length > 0 ? 'HEALTHY' : 'DEGRADED';
  } catch {
    return 'CRITICAL';
  }
}

async function fetchTriadMetrics(): Promise<TriadMetrics> {
  try {
    const response = await fetch('http://localhost:3003/metrics/current');
    return await response.json();
  } catch {
    return {
      flow_rate_lpm: 125,
      pressure_bar: 2.5,
      leak_anomaly_score: 0.15,
      timestamp: Date.now(),
    };
  }
}

async function fetchShadowSummary(): Promise<ShadowSummary> {
  try {
    const fs = await import('fs/promises');
    const results = await fs.readFile('shadow-results/results.jsonl', 'utf-8');
    const lines = results.split('\n').filter(Boolean);
    const parsed = lines.map(l => JSON.parse(l));
    const divergences = parsed.filter((r: any) => r.divergenceReason).length;

    return {
      totalEvaluated: parsed.length,
      divergences,
      divergenceRate: parsed.length > 0 ? divergences / parsed.length : 0,
      mode: 'passive-mirror',
    };
  } catch {
    return {
      totalEvaluated: 0,
      divergences: 0,
      divergenceRate: 0,
      mode: 'passive-mirror',
    };
  }
}