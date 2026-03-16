/**
 * Ubuntu Pools — Performance Monitoring
 * Web Vitals tracking for real user experience measurement
 */

type MetricName = 'CLS' | 'INP' | 'FCP' | 'LCP' | 'TTFB';

interface Metric {
  name: MetricName;
  value: number;
  delta: number;
  id: string;
}

type ReportCallback = (metric: Metric) => void;

interface WebVitals {
  onCLS: (callback: ReportCallback) => void;
  onINP: (callback: ReportCallback) => void;
  onFCP: (callback: ReportCallback) => void;
  onLCP: (callback: ReportCallback) => void;
  onTTFB: (callback: ReportCallback) => void;
}

let webVitals: WebVitals | null = null;

async function loadWebVitals(): Promise<WebVitals | null> {
  if (webVitals) return webVitals;
  
  try {
    const webVitalsModule = await import('web-vitals');
    webVitals = {
      onCLS: webVitalsModule.onCLS,
      onINP: webVitalsModule.onINP,
      onFCP: webVitalsModule.onFCP,
      onLCP: webVitalsModule.onLCP,
      onTTFB: webVitalsModule.onTTFB,
    };
    return webVitals;
  } catch {
    return null;
  }
}

function getRating(value: number, metric: MetricName): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<MetricName, { poor: number; needsImprovement: number }> = {
    CLS: { poor: 0.25, needsImprovement: 0.1 },
    INP: { poor: 300, needsImprovement: 100 },
    FCP: { poor: 3000, needsImprovement: 1800 },
    LCP: { poor: 4000, needsImprovement: 2500 },
    TTFB: { poor: 800, needsImprovement: 400 },
  };
  
  const { poor, needsImprovement } = thresholds[metric];
  
  if (value <= needsImprovement) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

function logMetric(metric: Metric): void {
  const rating = getRating(metric.value, metric.name);
  const context = {
    metric: metric.name,
    value: metric.value.toFixed(2),
    delta: metric.delta.toFixed(2),
    id: metric.id,
    rating,
  };
  
  if (rating === 'poor') {
    console.warn(`[Web Vitals] Poor ${metric.name}:`, context);
  } else if (rating === 'needs-improvement') {
    console.log(`[Web Vitals] Needs improvement ${metric.name}:`, context);
  } else {
    console.log(`[Web Vitals] Good ${metric.name}:`, context);
  }
  
  if (process.env.NODE_ENV === 'production') {
    const { logger } = require('./logger');
    logger.info(`web_vital_${metric.name.toLowerCase()}`, context);
  }
}

export async function initPerformanceMonitoring(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const vitals = await loadWebVitals();
  if (!vitals) {
    console.warn('[Performance] web-vitals package not installed');
    return;
  }
  
  vitals.onCLS(logMetric);
  vitals.onINP(logMetric);
  vitals.onFCP(logMetric);
  vitals.onLCP(logMetric);
  vitals.onTTFB(logMetric);
}

export async function getWebVitals(): Promise<Metric[]> {
  return new Promise((resolve) => {
    const metrics: Metric[] = [];
    let loaded = false;
    
    loadWebVitals().then((vitals) => {
      if (!vitals || loaded) {
        resolve(metrics);
        return;
      }
      
      const collect = (metric: Metric) => {
        metrics.push(metric);
      };
      
      vitals.onCLS(collect);
      vitals.onINP(collect);
      vitals.onFCP(collect);
      vitals.onLCP(collect);
      vitals.onTTFB(collect);
      
      setTimeout(() => {
        loaded = true;
        resolve(metrics);
      }, 5000);
    });
  });
}

export const initPerformance = initPerformanceMonitoring;
