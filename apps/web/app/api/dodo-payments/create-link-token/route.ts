import { NextRequest, NextResponse } from 'next/server';
import { getDodoPaymentsProvider } from '@/lib/bank-provider/dodo-payments';

export async function POST(request: NextRequest) {
  try {
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const provider = getDodoPaymentsProvider();
    const linkToken = await provider.createLinkToken(user_id);

    return NextResponse.json({ link_token: linkToken });
  } catch (error) {
    console.error('Dodo Payments create-link-token error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create link token' },
      { status: 500 }
    );
  }
}
