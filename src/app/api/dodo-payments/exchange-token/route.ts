import { NextRequest, NextResponse } from 'next/server';
import { getDodoPaymentsProvider } from '@ubuntu/credit/dodo-payments';

export async function POST(request: NextRequest) {
  try {
    const { public_token, institution_id, institution_name } = await request.json();

    if (!public_token) {
      return NextResponse.json(
        { error: 'Public token is required' },
        { status: 400 }
      );
    }

    const provider = getDodoPaymentsProvider();
    const { accessToken, itemId } = await provider.exchangeToken(public_token);

    const connection = {
      connectionId: itemId,
      institutionId: institution_id || 'unknown',
      institutionName: institution_name || 'Unknown Bank',
      accessToken,
      status: 'active' as const,
      accounts: [],
      lastSynced: new Date(),
    };

    return NextResponse.json({
      access_token: accessToken,
      item_id: itemId,
      connection,
    });
  } catch (error) {
    console.error('Dodo Payments exchange-token error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to exchange token' },
      { status: 500 }
    );
  }
}
