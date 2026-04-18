/**
 * Ubuntu Pools — Credit Payments API
 * Process loan payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { creditService } from '@ubuntu/credit';
import { z } from 'zod';

const paymentRequestSchema = z.object({
  loanId: z.string(),
  amount: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = paymentRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.issues },
        { status: 400 }
      );
    }

    const payment = creditService.processPayment(
      result.data.loanId,
      result.data.amount
    );

    if (!payment.success) {
      return NextResponse.json(
        { error: 'Payment failed', loanId: result.data.loanId },
        { status: 400 }
      );
    }

    return NextResponse.json(payment);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}
