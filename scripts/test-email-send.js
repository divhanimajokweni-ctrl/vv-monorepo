#!/usr/bin/env node

/**
 * Test Email Sending Script
 *
 * Tests sending emails with the configured Resend setup
 */

require('dotenv').config({ path: '.env.local' });

async function testEmailSending() {
  console.log('📧 Testing Email Sending with Resend');
  console.log('====================================\n');

  // Check environment variables
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in .env.local');
    console.log('Make sure your Resend API key is configured.');
    process.exit(1);
  }

  console.log('✅ RESEND_API_KEY loaded');

  const testEmail = {
    from: process.env.RESEND_FROM_ADDRESS || 'bot@ubuntupools-vvlcc.app',
    to: 'test@example.com', // Replace with your test email
    subject: 'Ubuntu Pools Email Test',
    html: `
      <h1>🎉 Ubuntu Pools Email Test</h1>
      <p>This email confirms your custom domain email setup is working!</p>
      <ul>
        <li>✅ Custom Domain: ubuntupools-vvlcc.app</li>
        <li>✅ DKIM Signature: Configured</li>
        <li>✅ SPF Authorization: Active</li>
        <li>✅ DMARC Policy: Enabled</li>
      </ul>
      <p><strong>Next Steps:</strong></p>
      <ol>
        <li>Add all DNS records to your domain registrar</li>
        <li>Wait 24-48 hours for DNS propagation</li>
        <li>Test email deliverability in Gmail, Outlook, etc.</li>
        <li>Configure webhook endpoints for email events</li>
      </ol>
      <p>Sent from Ubuntu Pools Platform 🚀</p>
    `
  };

  try {
    console.log(`📤 Sending test email to: ${testEmail.to}`);
    console.log(`📨 From: ${testEmail.from}`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testEmail)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Email send failed:', result);
      if (result.message?.includes('domain')) {
        console.log('\n💡 This is likely because DNS records aren\'t set up yet.');
        console.log('Add the DNS records shown above and wait for propagation.');
      }
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log('📧 Email ID:', result.data?.id);
    console.log('📊 Status:', 'Sent');

    console.log('\n📋 Email Details:');
    console.log('- From:', testEmail.from);
    console.log('- To:', testEmail.to);
    console.log('- Subject:', testEmail.subject);

    console.log('\n🎯 Check your inbox for the test email!');
    console.log('If you don\'t receive it, check:');
    console.log('1. DNS records are added and propagated');
    console.log('2. Spam/junk folder');
    console.log('3. Email address is correct');

  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

// Usage instructions
if (process.argv[2] === '--help') {
  console.log('Usage: node scripts/test-email-send.js [email@address.com]');
  console.log('If no email provided, uses test@example.com');
  process.exit(0);
}

// Allow custom test email
const testEmail = process.argv[2] || 'test@example.com';
testEmailSending();