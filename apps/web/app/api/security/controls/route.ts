/**
 * Ubuntu Pools — Security Controls API
 * Main endpoints for security control inventory management
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { securityControlsService } from '@/lib/services/security-controls-service';
import {
  type ControlCategory,
  type ControlStatus,
  type ControlPriority,
  type RiskLevel,
} from '@/db/schema-security-controls';

const createControlSchema = z.object({
  controlId: z.string().min(1).max(20),
  category: z.enum(['INFRASTRUCTURE', 'ORGANIZATIONAL', 'PRODUCT', 'INTERNAL_PROCEDURES', 'DATA_PRIVACY']),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  systemComponent: z.string().min(1),
  status: z.enum(['implemented', 'partial', 'missing', 'not_applicable']).default('missing'),
  priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  owner: z.string().optional(),
  riskLevel: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  gapDescription: z.string().optional(),
  recommendation: z.string().optional(),
  relatedControls: z.array(z.string()).default([]),
  frameworkReferences: z.array(z.string()).default([]),
});

const updateControlSchema = createControlSchema.partial().omit({ controlId: true });

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') as ControlCategory | null;
    const status = searchParams.get('status') as ControlStatus | null;
    const priority = searchParams.get('priority') as ControlPriority | null;
    const search = searchParams.get('search');
    const framework = searchParams.get('framework');
    
    if (search) {
      const results = await securityControlsService.searchControls(search);
      return NextResponse.json({ controls: results });
    }
    
    if (framework) {
      const results = await securityControlsService.getControlsByFramework(framework);
      return NextResponse.json({ controls: results });
    }
    
    const filters = {
      ...(category && { category }),
      ...(status && { status }),
      ...(priority && { priority }),
    };
    
    const controls = await securityControlsService.getAllControls(
      Object.keys(filters).length > 0 ? filters : undefined
    );
    
    return NextResponse.json({ controls });
  } catch (error) {
    console.error('Failed to fetch controls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security controls' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createControlSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.issues },
        { status: 400 }
      );
    }
    
    const existing = await securityControlsService.getControlByControlId(result.data.controlId);
    if (existing) {
      return NextResponse.json(
        { error: 'Control ID already exists' },
        { status: 409 }
      );
    }
    
    const control = await securityControlsService.createControl(result.data);
    
    return NextResponse.json({ control }, { status: 201 });
  } catch (error) {
    console.error('Failed to create control:', error);
    return NextResponse.json(
      { error: 'Failed to create security control' },
      { status: 500 }
    );
  }
}
