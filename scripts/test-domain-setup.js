#!/usr/bin/env node

/**
 * Test Domain Setup Script
 *
 * This script tests the domain setup API endpoint
 * Make sure to set RESEND_API_KEY in your environment
 */

const DOMAIN = 'ubuntupools-vvlcc.app';

async function testDomainSetup() {
  console.log('🧪 Testing Domain Setup for Ubuntu Pools');
  console.log('========================================\n');

  // Check if API key is set
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY environment variable is not set');
    console.log('\nPlease set your Resend API key:');
    console.log('export RESEND_API_KEY=your_api_key_here');
    process.exit(1);
  }

  try {
    console.log(`📡 Testing domain setup for: ${DOMAIN}`);
    console.log('This will:');
    console.log('1. Check if domain exists in Resend');
    console.log('2. Add domain if it doesn\'t exist');
    console.log('3. Retrieve DNS records needed\n');

    const response = await fetch('http://localhost:3000/api/resend/setup-domain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ domain: DOMAIN })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ API Error:', result.error);
      if (result.details) {
        console.error('Details:', result.details);
      }
      return;
    }

    console.log('✅ Success!');
    console.log('📋 Domain Status:', result.domain?.status || 'Unknown');
    console.log('🆔 Domain ID:', result.domain?.id || 'Unknown');

    if (result.setup_instructions) {
      console.log('\n📝 DNS Setup Instructions:');
      console.log(result.setup_instructions.message);

      console.log('\n🌐 Vercel Domain Record:');
      const vercel = result.setup_instructions.vercel_domain;
      console.log(`Type: ${vercel.type}`);
      console.log(`Host: ${vercel.host}`);
      console.log(`Value: ${vercel.value}`);
      console.log(`Purpose: ${vercel.purpose}`);

      console.log('\n📧 Email DNS Records:');
      result.setup_instructions.email_records.forEach((record, index) => {
        console.log(`\n${index + 1}. ${record.purpose}`);
        console.log(`   Type: ${record.type}`);
        console.log(`   Host: ${record.host}`);
        console.log(`   Value: ${record.value}`);
      });

      console.log('\n🚀 Next Steps:');
      result.setup_instructions.next_steps.forEach(step => {
        console.log(`• ${step}`);
      });
    }

  } catch (error) {
    console.error('❌ Network Error:', error.message);
    console.log('\nMake sure the development server is running:');
    console.log('bun dev');
  }
}

// Run the test
testDomainSetup();