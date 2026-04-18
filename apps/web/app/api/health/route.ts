import { NextResponse } from 'next/server';
import { db } from '@ubuntu/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
  let dbStatus = 'ok';
  let dbLatencyMs = 0;

  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    dbLatencyMs = Date.now() - start;
  } catch (e) {
    dbStatus = 'error';
  }

  const healthy = dbStatus === 'ok';

  return NextResponse.json(
    {
      status:      healthy ? 'ok' : 'degraded',
      service:     'ubuntu-pools',
      version:     process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      timestamp:   new Date().toISOString(),
      checks: {
        database: { status: dbStatus, latencyMs: dbLatencyMs },
      },
    },
    { status: healthy ? 200 : 503 }
  );
}