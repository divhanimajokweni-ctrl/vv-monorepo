import { NextResponse } from 'next/server';
import { getSystemHealth } from '@ubuntu/observability/service';
import { db, pgClient } from '@ubuntu/db/client';
import { events } from '@ubuntu/db/schema';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: {
      status: 'up' | 'down' | 'degraded';
      latency: number | null;
      error?: string;
    };
    cache: {
      status: 'up' | 'down' | 'unknown';
      using: 'redis' | 'memory' | 'none';
    };
    memory: {
      usedMB: number;
      totalMB: number;
      percentage: number;
    };
  };
}

export async function GET() {
  const startTime = Date.now();
  let dbStatus: HealthCheckResponse['checks']['database'] = {
    status: 'down',
    latency: null,
  };
  let cacheStatus: HealthCheckResponse['checks']['cache'] = {
    status: 'unknown',
    using: 'none',
  };
  let memoryUsage = { usedMB: 0, totalMB: 0, percentage: 0 };

  if (process.memoryUsage) {
    const mem = process.memoryUsage();
    memoryUsage = {
      usedMB: Math.round(mem.heapUsed / 1024 / 1024),
      totalMB: Math.round(mem.heapTotal / 1024 / 1024),
      percentage: Math.round((mem.heapUsed / mem.heapTotal) * 100),
    };
  }

  try {
    const dbStart = Date.now();
    await db.select({ id: events.id }).from(events).limit(1);
    dbStatus = {
      status: 'up',
      latency: Date.now() - dbStart,
    };
  } catch (error) {
    dbStatus = {
      status: 'down',
      latency: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  try {
    const { CacheEngine } = await import('@ubuntu/cache/engine');
    cacheStatus = {
      status: 'up',
      using: CacheEngine.isUsingRedis() ? 'redis' : 'memory',
    };
  } catch {
    cacheStatus = {
      status: 'unknown',
      using: 'none',
    };
  }

  const dbLatency = dbStatus.latency ?? 999;
  let overallStatus: HealthCheckResponse['status'] = 'healthy';
  
  if (dbStatus.status === 'down' || dbLatency > 1000 || memoryUsage.percentage > 90) {
    overallStatus = 'critical';
  } else if (dbLatency > 500 || memoryUsage.percentage > 80) {
    overallStatus = 'degraded';
  }

  const response: HealthCheckResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime?.() ?? 0,
    version: process.env.APP_VERSION || '1.0.0',
    checks: {
      database: dbStatus,
      cache: cacheStatus,
      memory: memoryUsage,
    },
  };

  const statusCode = overallStatus === 'critical' ? 503 : 200;
  return NextResponse.json(response, { status: statusCode });
}
