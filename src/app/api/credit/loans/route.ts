/**
 * Ubuntu Pools — Credit Loan API
 * Request and manage credit loans
 */

import { NextRequest, NextResponse } from 'next/server';
import { creditService } from '@ubuntu/credit';
import { z } from 'zod';

const loanRequestSchema = z.object({
  poolId: z.string().uuid(),
  memberId: z.string().uuid(),
  amount: z.number().int().positive(),
  termDays: z.number().int().positive(),
  purpose: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = loanRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.issues },
        { status: 400 }
      );
    }

    const approval = creditService.approveLoan(result.data);

    if (!approval.approved) {
      return NextResponse.json(
        { error: 'Loan rejected', reason: approval.reason },
        { status: 400 }
      );
    }

    return NextResponse.json(approval, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process loan request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const memberId = searchParams.get('memberId');
  const poolId = searchParams.get('poolId');

  if (!memberId) {
    return NextResponse.json(
      { error: 'memberId is required' },
      { status: 400 }
    );
  }

  const loans = creditService.getMemberLoans(memberId);
  
  let filteredLoans = loans;
  if (poolId) {
    filteredLoans = loans.filter(loan => loan.poolId === poolId);
  }

  return NextResponse.json(filteredLoans);
}
