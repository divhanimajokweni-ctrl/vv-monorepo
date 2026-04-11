import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { waitlist } from '@/db/schema';
import { sendEmail } from '@/lib/email';
import { getWhatsAppProvider } from '@/lib/integrations/whatsapp';

export async function POST(req: NextRequest) {
  // POPIA gate — must be explicit in header
  const popiaConsent = req.headers.get('x-popia-consent');
  if (popiaConsent !== 'granted') {
    return NextResponse.json(
      { error: 'POPIA consent required', code: 'POPIA_CONSENT_MISSING' },
      { status: 403 }
    );
  }

  let body: { email?: string; name?: string; phone?: string; stokvel_coordinator?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { email, name, phone, stokvel_coordinator } = body;

  if (!email || !name) {
    return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    await db.insert(waitlist).values({
      email:               cleanEmail,
      name,
      phone:               phone ?? null,
      stokvelCoordinator: stokvel_coordinator ?? false,
      source:              'waitlist',
    })
    .onConflictDoNothing();
  } catch (e) {
    console.error('[waitlist/join] DB error:', e);
    return NextResponse.json({ error: 'Could not save. Please try again.' }, { status: 500 });
  }

  // Confirmation email — non-blocking
  const emailResult = await sendEmail(
    {
      from:    'Ubuntu Pools <hello@ubuntupools.app>',
      to:      [cleanEmail],
      subject: `You're on the Ubuntu Pools waitlist, ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
          <div style="background:#0D1B2A;padding:24px;border-radius:12px 12px 0 0">
            <h1 style="color:#B8962E;margin:0;font-size:22px">Ubuntu Pools</h1>
          </div>
          <div style="background:#f9f9f9;padding:32px;border-radius:0 0 12px 12px">
            <h2 style="margin-top:0">Sawubona ${name},</h2>
            <p>You're confirmed on the Ubuntu Pools waitlist.</p>
            <p>We're launching our first pool in Gqeberha soon. When your pool opens,
            you'll be first to know — with full details on how to stake from as little as
            <strong>R500</strong>.</p>
            <p style="background:#fff;border-left:3px solid #B8962E;padding:12px 16px;
            border-radius:4px;font-style:italic">
              "Umuntu ngumuntu ngabantu" — I am because we are.
            </p>
            <p>— Mino &amp; the Ubuntu Pools team</p>
            <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0"/>
            <p style="font-size:12px;color:#888">
              Your data is processed under POPIA with your explicit consent.
              To withdraw consent or remove your data, reply to this email.
            </p>
          </div>
        </div>
      `,
    },
    `waitlist-confirmation/${cleanEmail}`
  );

  if (!emailResult.success) {
    console.error('[waitlist/join] Email failed (non-fatal):', emailResult.error);
  }

  // WhatsApp community messaging — non-blocking
  if (phone) {
    try {
      const whatsAppProvider = getWhatsAppProvider();
      // Send welcome message asynchronously
      whatsAppProvider.sendWelcomeMessage(phone).catch(error => {
        console.error('[waitlist/join] WhatsApp failed (non-fatal):', error);
      });
    } catch (error) {
      console.error('[waitlist/join] WhatsApp setup failed (non-fatal):', error);
    }
  }

  return NextResponse.json(
    { success: true, message: "You're on the waitlist. Check your email and WhatsApp for confirmation." },
    { status: 201 }
  );
}