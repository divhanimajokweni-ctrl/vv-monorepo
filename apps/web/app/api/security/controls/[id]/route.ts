/**
 * Ubuntu Pools — Individual Security Control API
 * Get, update, or delete a specific control
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@ubuntu/db/client';
import { securityControls } from '@ubuntu/db/schema-security-controls';
import { securityControlsService } from '@ubuntu/auth';
import { type ControlStatus } from '@ubuntu/db/schema-security-controls';
import { eq } from 'drizzle-orm';

const updateStatusSchema = z.object({
  status: z.enum(['implemented', 'partial', 'missing', 'not_applicable']),
  assessorId: z.string().uuid(),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const details = searchParams.get('details') === 'true';
    
    const control = details
      ? await securityControlsService.getControlWithDetails(id)
      : await securityControlsService.getControlById(id);
    
    if (!control) {
      return NextResponse.json(
        { error: 'Control not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ control });
  } catch (error) {
    console.error('Failed to fetch control:', error);
    return NextResponse.json(
      { error: 'Failed to fetch control' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const control = await securityControlsService.getControlById(id);
    if (!control) {
      return NextResponse.json(
        { error: 'Control not found' },
        { status: 404 }
      );
    }
    
    if (body.status && body.assessorId) {
      const statusResult = updateStatusSchema.safeParse(body);
      if (!statusResult.success) {
        return NextResponse.json(
          { error: 'Invalid status update', details: statusResult.error.issues },
          { status: 400 }
        );
      }
      
      const assessment = await securityControlsService.updateControlStatus(
        id,
        body.status as ControlStatus,
        body.assessorId,
        body.notes
      );
      
      const updatedControl = await securityControlsService.getControlById(id);
      
      return NextResponse.json({ control: updatedControl, assessment });
    }
    
    const updated = await securityControlsService.updateControl(id, body);
    
    return NextResponse.json({ control: updated });
  } catch (error) {
    console.error('Failed to update control:', error);
    return NextResponse.json(
      { error: 'Failed to update control' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const control = await securityControlsService.getControlById(id);
    if (!control) {
      return NextResponse.json(
        { error: 'Control not found' },
        { status: 404 }
      );
    }
    
    await db.delete(securityControls).where(eq(securityControls.id, id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete control:', error);
    return NextResponse.json(
      { error: 'Failed to delete control' },
      { status: 500 }
    );
  }
}
