/**
 * Ubuntu Pools — Sovereignty API
 * Handle sovereignty toggle and profile management
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sovereigntyProxy, configureSovereignty, SovereigntySettingsSchema } from '@ubuntu/sovereignty';

const toggleSchema = z.object({
  memberId: z.string().uuid(),
  enabled: z.boolean(),
});

const ingestSchema = z.object({
  memberId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  source: z.enum(['instagram', 'tiktok', 'stitch', 'manual']),
});

const configureSchema = SovereigntySettingsSchema;

const eraseGamesSchema = z.object({
  memberId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (request.nextUrl.pathname.endsWith('/toggle')) {
      const result = toggleSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: result.error.issues },
          { status: 400 }
        );
      }

      const profile = sovereigntyProxy.toggleSovereignty(result.data.memberId, result.data.enabled);
      return NextResponse.json(profile);
    }
    
    if (request.nextUrl.pathname.endsWith('/configure')) {
      const result = configureSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: result.error.issues },
          { status: 400 }
        );
      }

      const settings = configureSovereignty(result.data);
      return NextResponse.json(settings);
    }
    
    if (request.nextUrl.pathname.endsWith('/ingest')) {
      const result = ingestSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: result.error.issues },
          { status: 400 }
        );
      }

      const tags = sovereigntyProxy.ingestData(
        result.data.memberId,
        result.data.content,
        result.data.source
      );

      const profile = sovereigntyProxy.getSanitizedProfile(result.data.memberId);
      return NextResponse.json({ tags, profile });
    }

    if (request.nextUrl.pathname.endsWith('/erase-games')) {
      const result = eraseGamesSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: result.error.issues },
          { status: 400 }
        );
      }

      const erasureResult = await sovereigntyProxy.eraseGameTelemetry(result.data.memberId);
      return NextResponse.json(erasureResult);
    }

    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 });
  } catch (error) {
    console.error('Sovereignty API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const memberId = searchParams.get('memberId');

  if (!memberId) {
    return NextResponse.json(
      { error: 'memberId is required' },
      { status: 400 }
    );
  }

  const profile = sovereigntyProxy.getSanitizedProfile(memberId);
  const settings = sovereigntyProxy.getSettings(memberId);

  return NextResponse.json({
    profile,
    settings,
  });
}
