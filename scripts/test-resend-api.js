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

    console.log('📧 Available domains in your Resend account:');
    domains.data?.forEach(domain => {
      console.log(`   • ${domain.name} (${domain.status})`);
    });

    const existingDomain = domains.data?.find(d => d.name === DOMAIN);
    if (existingDomain) {
      console.log(`\n📝 Domain ${DOMAIN} already exists (ID: ${existingDomain.id})`);
      console.log(`📊 Status: ${existingDomain.status}`);
    } else {
      console.log(`\n📝 Domain ${DOMAIN} not found in Resend.`);
      console.log('ℹ️  Note: For Vercel domains, you may not need to add them to Resend explicitly.');
      console.log('   Resend can send emails from any verified domain as long as you own it.');
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