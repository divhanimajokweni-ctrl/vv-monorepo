#!/usr/bin/env node

/**
 * Direct Resend API Test Script
 *
 * Tests Resend API connectivity without Next.js server
 */

require('dotenv').config({ path: '.env.local' });

const DOMAIN = 'workspace-gbexj9x1f-divhanimajokweni-1651s-projects.vercel.app';

async function testResendAPI() {
  console.log('🧪 Direct Resend API Test');
  console.log('=========================\n');

  // Check environment variables
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in .env.local');
    process.exit(1);
  }

  console.log('✅ RESEND_API_KEY loaded');
  console.log(`📧 Testing with domain: ${DOMAIN}\n`);

  try {
    // Test 1: List domains
    console.log('📋 Testing: List existing domains...');
    const listResponse = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!listResponse.ok) {
      throw new Error(`List domains failed: ${listResponse.status} ${listResponse.statusText}`);
    }

    const domains = await listResponse.json();
    console.log(`✅ Found ${domains.data?.length || 0} existing domains`);

    const existingDomain = domains.data?.find(d => d.name === DOMAIN);
    if (existingDomain) {
      console.log(`📝 Domain ${DOMAIN} already exists (ID: ${existingDomain.id})`);
      console.log(`📊 Status: ${existingDomain.status}`);

      // Try to verify the domain first
      console.log('🔍 Attempting to verify domain...');
      const verifyResponse = await fetch(`https://api.resend.com/domains/${existingDomain.id}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const verifyResult = await verifyResponse.json();
      console.log('Verification result:', verifyResult);

      // Get domain details
      const detailResponse = await fetch(`https://api.resend.com/domains/${existingDomain.id}`, {
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (detailResponse.ok) {
        const domainDetails = await detailResponse.json();
        console.log('📄 Domain Details:');
        console.log(`   Status: ${domainDetails.data?.status}`);
        console.log(`   Created: ${domainDetails.data?.created_at}`);
        console.log(`   DKIM: ${domainDetails.data?.dkim_key ? '✅ Configured' : '❌ Missing'}`);

        // Show DNS records if available
        if (domainDetails.data?.dkim_key) {
          console.log('\n📧 REQUIRED DNS Records for workspace-gbexj9x1f-divhanimajokweni-1651s-projects.vercel.app:');
          console.log('TXT | resend._domainkey.workspace-gbexj9x1f-divhanimajokweni-1651s-projects.vercel.app |', domainDetails.data.dkim_key);
          console.log('TXT | send.workspace-gbexj9x1f-divhanimajokweni-1651s-projects.vercel.app | v=spf1 include:amazonses.com ~all');
          console.log('TXT | _dmarc.workspace-gbexj9x1f-divhanimajokweni-1651s-projects.vercel.app | v=DMARC1; p=none; rua=mailto:dmarc@workspace-gbexj9x1f-divhanimajokweni-1651s-projects.vercel.app');
          console.log('MX | send.workspace-gbexj9x1f-divhanimajokweni-1651s-projects.vercel.app | 10 feedback-smtp.eu-west-1.amazonaws.com');
          console.log('MX | @ (workspace-gbexj9x1f-divhanimajokweni-1651s-projects.vercel.app) | 10 inbound-smtp.eu-west-1.amazonaws.com');
          console.log('\n✅ Add these DNS records to your domain registrar!');
        } else {
          console.log('\n⏳ DKIM key still generating...');
          console.log('\n📋 While waiting, here are the DNS records you\'ll need (DKIM will be ready soon):');
          console.log('TXT | resend._domainkey.workspace-gbexj9x1f-divhanimajokweni-1651s-projects.vercel.app | [Get from Resend dashboard]');
          console.log('TXT | send.workspace-gbexj9x1f-divhanimajokweni-1651s-projects.vercel.app | v=spf1 include:amazonses.com ~all');
          console.log('TXT | _dmarc.workspace-gbexj9x1f-divhanimajokweni-1651s-projects.vercel.app | v=DMARC1; p=none; rua=mailto:dmarc@workspace-gbexj9x1f-divhanimajokweni-1651s-projects.vercel.app');
          console.log('MX | send.workspace-gbexj9x1f-divhanimajokweni-1651s-projects.vercel.app | 10 feedback-smtp.eu-west-1.amazonaws.com');
          console.log('MX | @ (workspace-gbexj9x1f-divhanimajokweni-1651s-projects.vercel.app) | 10 inbound-smtp.eu-west-1.amazonaws.com');
          console.log('\n🔗 Check your DKIM key at: https://resend.com/domains');
          console.log('📝 Go to Domains → workspace-gbexj9x1f-divhanimajokweni-1651s-projects.vercel.app → DNS Records tab');
        }
      }
    } else {
      console.log(`🆕 Domain ${DOMAIN} not found, creating new one...`);

      // Test 2: Create domain
      const createResponse = await fetch('https://api.resend.com/domains', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: DOMAIN })
      });

      if (!createResponse.ok) {
        throw new Error(`Create domain failed: ${createResponse.status} ${createResponse.statusText}`);
      }

      const createResult = await createResponse.json();
      console.log('📄 Create response:', JSON.stringify(createResult, null, 2));
      console.log(`✅ Domain created with ID: ${createResult.data?.id}`);

      // Get domain details with DNS records
      const detailResponse = await fetch(`https://api.resend.com/domains/${createResult.data?.id}`, {
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (detailResponse.ok) {
        const domainDetails = await detailResponse.json();
        console.log('\n📧 Domain DNS Records:');
        if (domainDetails.data?.dkim_key) {
          console.log('TXT | resend._domainkey.ubuntupools-vvlcc.app |', domainDetails.data.dkim_key);
        } else {
          console.log('DKIM Key: Not available yet - check back in a few minutes');
        }
        console.log('\n📋 Next Steps:');
        console.log('1. Add the DNS records shown above to your domain registrar');
        console.log('2. Wait 24-48 hours for DNS propagation');
        console.log('3. Verify domain in Resend dashboard');
      }
    }

    console.log('\n🎉 Resend API connection successful!');

  } catch (error) {
    console.error('❌ API Error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your RESEND_API_KEY in .env.local');
    console.log('2. Verify your Resend account has API access');
    console.log('3. Make sure you have internet connectivity');
  }
}

testResendAPI();