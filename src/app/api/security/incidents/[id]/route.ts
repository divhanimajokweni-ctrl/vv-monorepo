/**
 * Ubuntu Pools — Individual Security Incident API
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { securityControlsService } from '@ubuntu/auth';

const updateIncidentSchema = z.object({
  status: z.enum(['open', 'investigating', 'contained', 'resolved', 'closed']).optional(),
  resolutionNotes: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  affectedControls: z.array(z.string()).optional(),
  affectedSystems: z.array(z.string()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const incidents = await securityControlsService.getAllIncidents();
    const incident = incidents.find(i => i.id === id);
    
    if (!incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ incident });
  } catch (error) {
    console.error('Failed to fetch incident:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incident' },
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
    const result = updateIncidentSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.issues },
        { status: 400 }
      );
    }
    
    const incidents = await securityControlsService.getAllIncidents();
    const existing = incidents.find(i => i.id === id);
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }
    
    const updateData: Record<string, unknown> = { ...result.data };
    
    if (result.data.status === 'resolved' || result.data.status === 'closed') {
      updateData.resolvedAt = new Date();
    }
    
    const updated = await securityControlsService.updateIncident(id, updateData);
    
    return NextResponse.json({ incident: updated });
  } catch (error) {
    console.error('Failed to update incident:', error);
    return NextResponse.json(
      { error: 'Failed to update incident' },
      { status: 500 }
    );
  }
}
