import { NextResponse } from 'next/server';
import { db } from '@ubuntu/db/client';
import { waitlist } from '@ubuntu/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(waitlist);
    return NextResponse.json({ count: result[0]?.count ?? 0 });
  } catch {
    return NextResponse.json({ error: 'Could not fetch count' }, { status: 500 });
  }
}