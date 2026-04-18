import { NextRequest, NextResponse } from 'next/server';
import { getDodoPaymentsProvider } from '@ubuntu/credit/dodo-payments';

export async function POST(request: NextRequest) {
  try {
    const { access_token, start_date, end_date } = await request.json();

    if (!access_token) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    const provider = getDodoPaymentsProvider();

    const result = await provider.getTransactions(
      access_token,
      start_date || '2024-01-01',
      end_date || new Date().toISOString().split('T')[0]
    );

    return NextResponse.json({
      transactions: result.transactions,
      accounts: result.accounts,
    });
  } catch (error) {
    console.error('Dodo Payments transactions error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
