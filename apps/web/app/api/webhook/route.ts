import { NextRequest } from 'next/server';
import { chat } from '@/lib/resend-chat';

export async function POST(request: NextRequest) {
  try {
    const result = await chat.webhooks.resend(request);
    return new Response(null, { status: result.status });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Error processing webhook', { status: 500 });
  }
}
