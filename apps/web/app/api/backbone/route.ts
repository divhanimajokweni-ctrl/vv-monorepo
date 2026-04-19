import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ubuntuBackbone } from '@ubuntu/lindiwe';

async function getClerkUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

function isValidLimit(limit: string | null): number {
  const parsed = parseInt(limit || '50', 10);
  if (isNaN(parsed) || parsed < 1) return 50;
  if (parsed > 500) return 500;
  return parsed;
}

export async function GET(request: NextRequest) {
  const userId = await getClerkUserId();
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const memberId = searchParams.get('memberId');

    switch (action) {
      case 'state':
        return NextResponse.json(ubuntuBackbone.getState());

      case 'config':
        return NextResponse.json(ubuntuBackbone.getConfig());

      case 'audit':
        const limit = isValidLimit(searchParams.get('limit'));
        return NextResponse.json(ubuntuBackbone.getAuditTrail(limit));

      case 'member':
        if (!memberId) {
          return NextResponse.json({ error: 'memberId required' }, { status: 400 });
        }
        if (!userId) {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        if (memberId !== userId) {
          return NextResponse.json({ error: 'Unauthorized: cannot access other member profiles' }, { status: 403 });
        }
        const profile = ubuntuBackbone.getMemberProfile(memberId);
        if (!profile) {
          return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }
        return NextResponse.json(profile);

      case 'eligibility':
        if (!memberId) {
          return NextResponse.json({ error: 'memberId required' }, { status: 400 });
        }
        if (!userId) {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        if (memberId !== userId) {
          return NextResponse.json({ error: 'Unauthorized: cannot check eligibility for other members' }, { status: 403 });
        }
        return NextResponse.json(ubuntuBackbone.checkMemberEligibility(memberId));

      case 'all-members':
        if (!userId) {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        return NextResponse.json(ubuntuBackbone.getAllMemberProfiles());

      default:
        return NextResponse.json({
          state: ubuntuBackbone.getState(),
          config: ubuntuBackbone.getConfig(),
          stats: {
            totalMembers: ubuntuBackbone.getAllMemberProfiles().length,
            auditEntries: ubuntuBackbone.getAuditTrail().length,
          },
        });
    }
  } catch (error) {
    console.error('Backbone GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const userId = await getClerkUserId();
  
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, memberId, accessToken } = body;

    switch (action) {
      case 'sync':
        if (!memberId || !accessToken) {
          return NextResponse.json(
            { error: 'memberId and accessToken required' },
            { status: 400 }
          );
        }
        if (memberId !== userId) {
          return NextResponse.json(
            { error: 'Unauthorized: can only sync your own data' },
            { status: 403 }
          );
        }
        const profile = await ubuntuBackbone.syncMemberData(memberId);
        return NextResponse.json(profile);

      case 'regulate':
        return NextResponse.json(
          { error: 'Unauthorized: admin only action' },
          { status: 403 }
        );

      case 'update-buffer':
        return NextResponse.json(
          { error: 'Unauthorized: admin only action' },
          { status: 403 }
        );

      case 'update-pulse':
        return NextResponse.json(
          { error: 'Unauthorized: admin only action' },
          { status: 403 }
        );

      case 'check-eligibility':
        if (!memberId) {
          return NextResponse.json({ error: 'memberId required' }, { status: 400 });
        }
        if (memberId !== userId) {
          return NextResponse.json(
            { error: 'Unauthorized: cannot check eligibility for other members' },
            { status: 403 }
          );
        }
        return NextResponse.json(ubuntuBackbone.checkMemberEligibility(memberId));

      case 'matchmaker-input':
        if (!memberId) {
          return NextResponse.json({ error: 'memberId required' }, { status: 400 });
        }
        if (memberId !== userId) {
          return NextResponse.json(
            { error: 'Unauthorized: can only access your own matchmaker data' },
            { status: 403 }
          );
        }
        const input = ubuntuBackbone.generateMatchmakerInput(memberId);
        if (!input) {
          return NextResponse.json(
            { error: 'Member not synced. Please sync bank data first.' },
            { status: 400 }
          );
        }
        return NextResponse.json(input);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Backbone POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
