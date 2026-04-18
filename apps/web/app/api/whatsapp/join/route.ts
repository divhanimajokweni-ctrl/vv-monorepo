/**
 * Ubuntu Pools — WhatsApp Community Integration API
 *
 * Handles automated WhatsApp messaging for community engagement.
 * Triggers personal introduction messages when users confirm/join.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppProvider } from '@/lib/integrations/whatsapp';
import { requireAuth } from '@ubuntu/auth/middleware';

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count++;
  return true;
}

function sanitizePhoneNumber(phone: string | null): string | null {
  if (!phone || typeof phone !== 'string') return null;

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Ensure it starts with country code (assume South Africa if not present)
  if (digits.length === 9 && digits.startsWith('0')) {
    return `27${digits.slice(1)}`; // Convert 0712345678 to 27712345678
  } else if (digits.length === 9) {
    return `27${digits}`; // Add ZA country code
  } else if (digits.length === 11 && digits.startsWith('27')) {
    return digits; // Already in correct format
  } else if (digits.length === 10 && digits.startsWith('27')) {
    return digits; // Already in correct format
  }

  return null; // Invalid format
}

export async function POST(request: NextRequest) {
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

  if (!checkRateLimit(clientIP)) {
    return NextResponse.json(
      { error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const authResult = requireAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: authResult.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, phone_number, user_name } = body;

    if (action !== 'join_community') {
      return NextResponse.json(
        { error: 'INVALID_ACTION', message: 'Only join_community action is supported' },
        { status: 400 }
      );
    }

    const phoneNumber = sanitizePhoneNumber(phone_number);
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'INVALID_PHONE', message: 'Valid South African phone number required' },
        { status: 400 }
      );
    }

    // Check if user already confirmed recently (prevent spam)
    // In a real implementation, you'd check a database/cache

    const whatsAppProvider = getWhatsAppProvider();

    // Send the automated welcome message
    await whatsAppProvider.sendWelcomeMessage(phoneNumber);

    return NextResponse.json({
      success: true,
      message: 'Welcome message sent! Check your WhatsApp.',
      phone_number: phoneNumber,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[POST /api/whatsapp/join] Error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to send WhatsApp message' },
      { status: 500 }
    );
  }
}

// Webhook endpoint for WhatsApp Business API (if needed for responses)
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode');
  const token = request.nextUrl.searchParams.get('hub.verify_token');
  const challenge = request.nextUrl.searchParams.get('hub.challenge');

  // Verify webhook (implement proper verification logic)
  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 403 });
}