/**
 * Ubuntu Pools — Security Incidents API
 * Track and manage security incidents
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { securityControlsService } from '@ubuntu/auth';
import { type RiskLevel } from '@ubuntu/db/schema-security-controls';

const createIncidentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  affectedControls: z.array(z.string()).default([]),
  affectedSystems: z.array(z.string()).default([]),
  reportedBy: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
});

const updateIncidentSchema = z.object({
  status: z.enum(['open', 'investigating', 'contained', 'resolved', 'closed']),
  resolutionNotes: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  affectedControls: z.array(z.string()).optional(),
  affectedSystems: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const severity = searchParams.get('severity') as RiskLevel | null;
    const status = searchParams.get('status');
    
    const filters = {
      ...(severity && { severity }),
      ...(status && { status }),
    };
    
    const incidents = await securityControlsService.getAllIncidents(
      Object.keys(filters).length > 0 ? filters : undefined
    );
    
    return NextResponse.json({ incidents });
  } catch (error) {
    console.error('Failed to fetch incidents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incidents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createIncidentSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.issues },
        { status: 400 }
      );
    }
    
    const incident = await securityControlsService.createIncident({
      ...result.data,
      status: 'open',
    });
    
    return NextResponse.json({ incident }, { status: 201 });
  } catch (error) {
    console.error('Failed to create incident:', error);
    return NextResponse.json(
      { error: 'Failed to create incident' },
      { status: 500 }
    );
  }
}
