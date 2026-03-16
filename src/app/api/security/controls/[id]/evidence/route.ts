/**
 * Ubuntu Pools — Control Evidence API
 * Add and manage evidence for security controls
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { securityControlsService } from '@/lib/services/security-controls-service';
import { type EvidenceType } from '@/db/schema-security-controls';

const addEvidenceSchema = z.object({
  evidenceType: z.enum(['document', 'screenshot', 'log', 'configuration', 'test_report', 'audit_report', 'policy', 'procedure']),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  evidenceUrl: z.string().url().optional(),
  evidenceHash: z.string().optional(),
  submittedBy: z.string().uuid().optional(),
  expirationDate: z.string().datetime().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const evidence = await securityControlsService.getEvidenceForControl(id);
    
    return NextResponse.json({ evidence });
  } catch (error) {
    console.error('Failed to fetch evidence:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evidence' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = addEvidenceSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.issues },
        { status: 400 }
      );
    }
    
    const control = await securityControlsService.getControlById(id);
    if (!control) {
      return NextResponse.json(
        { error: 'Control not found' },
        { status: 404 }
      );
    }
    
    const evidence = await securityControlsService.addEvidence(id, {
      ...result.data,
      expirationDate: result.data.expirationDate ? new Date(result.data.expirationDate) : undefined,
    });
    
    return NextResponse.json({ evidence }, { status: 201 });
  } catch (error) {
    console.error('Failed to add evidence:', error);
    return NextResponse.json(
      { error: 'Failed to add evidence' },
      { status: 500 }
    );
  }
}
