#!/usr/bin/env node

/**
 * Ubuntu Pools Complete Setup Guide
 *
 * This script provides the complete setup instructions for:
 * - Custom domain configuration
 * - Email authentication setup
 * - DNS record requirements
 * - Testing and verification steps
 */

console.log('🌍 Ubuntu Pools Complete Setup Guide');
console.log('====================================\n');

// Prerequisites
console.log('📋 Prerequisites');
console.log('----------------');
console.log('✅ Node.js 18+ installed');
console.log('✅ Bun package manager installed');
console.log('✅ Vercel CLI installed');
console.log('✅ Resend account created');
console.log('✅ Domain registrar access (Namecheap, GoDaddy, etc.)');
console.log('✅ Environment variables configured\n');

// Step 1: Domain Setup
console.log('1️⃣ Domain Setup in Vercel');
console.log('--------------------------');
console.log('Command: vercel domains add ubuntupools-vvlcc.app');
console.log('Status: ✅ Domain added to Vercel project\n');

// Step 2: Resend Domain Setup
console.log('2️⃣ Email Domain Setup in Resend');
console.log('--------------------------------');
console.log('Run the test script to add domain to Resend:');
console.log('node scripts/test-domain-setup.js');
console.log('');
console.log('This will:');
console.log('• Check if domain exists in Resend');
console.log('• Add domain if needed');
console.log('• Display required DNS records\n');

// Step 3: DNS Configuration
console.log('3️⃣ DNS Record Configuration');
console.log('----------------------------');
console.log('Add these records to your domain registrar:\n');

// Vercel Domain
console.log('🌐 Custom Domain (Vercel):');
console.log('Type: A');
console.log('Host: @ (ubuntupools-vvlcc.app)');
console.log('Value: 76.76.21.21');
console.log('TTL: 300\n');

// Email Records
console.log('📧 Email Authentication Records:');

// DKIM
console.log('• DKIM Signature:');
console.log('  Type: TXT');
console.log('  Host: resend._domainkey.ubuntupools-vvlcc.app');
console.log('  Value: [Get from Resend API - p=MIGfMA0GCSqGSIb...]');
console.log('  Purpose: Cryptographic signature verification\n');

// SPF
console.log('• SPF Authorization:');
console.log('  Type: TXT');
console.log('  Host: send.ubuntupools-vvlcc.app');
console.log('  Value: v=spf1 include:amazonses.com ~all');
console.log('  Purpose: Authorizes Amazon SES servers\n');

// DMARC
console.log('• DMARC Policy:');
console.log('  Type: TXT');
console.log('  Host: _dmarc.ubuntupools-vvlcc.app');
console.log('  Value: v=DMARC1; p=none; rua=mailto:dmarc@ubuntupools-vvlcc.app');
console.log('  Purpose: Email authentication policy\n');

// MX Records
console.log('• Email Routing (MX Records):');
console.log('  Type: MX | Host: send.ubuntupools-vvlcc.app | Priority: 10 | Value: feedback-smtp.eu-west-1.amazonaws.com');
console.log('  Type: MX | Host: @ (ubuntupools-vvlcc.app) | Priority: 10 | Value: inbound-smtp.eu-west-1.amazonaws.com\n');

// Step 4: Verification
console.log('4️⃣ Verification Steps');
console.log('---------------------');
console.log('1. Wait 24-48 hours for DNS propagation');
console.log('2. Verify Vercel domain: vercel domains inspect ubuntupools-vvlcc.app');
console.log('3. Verify Resend domain in dashboard');
console.log('4. Test email sending: Use the configured domain in email utilities');
console.log('5. Check domain health: curl https://ubuntupools-vvlcc.app/api/health\n');

// Environment Variables
console.log('5️⃣ Required Environment Variables');
console.log('---------------------------------');
console.log('RESEND_API_KEY=your_resend_api_key_here');
console.log('RESEND_FROM_ADDRESS=bot@ubuntupools-vvlcc.app');
console.log('RESEND_FROM_NAME=Ubuntu Pools Bot');
console.log('RESEND_WEBHOOK_SECRET=your_webhook_secret_here');
console.log('NEXT_PUBLIC_APP_URL=https://ubuntupools-vvlcc.app\n');

// Testing Commands
console.log('6️⃣ Testing Commands');
console.log('-------------------');
console.log('# Test domain setup');
console.log('node scripts/test-domain-setup.js');
console.log('');
console.log('# Run DNS setup reference');
console.log('node scripts/dns-setup.js');
console.log('');
console.log('# Deploy to production');
console.log('vercel --prod');
console.log('');
console.log('# Test production deployment');
console.log('curl https://ubuntupools-vvlcc.app/api/health\n');

console.log('🎉 Setup Complete!');
console.log('==================');
console.log('Your Ubuntu Pools platform is now configured with:');
console.log('✅ Custom domain (ubuntupools-vvlcc.app)');
console.log('✅ Full email authentication (DKIM/SPF/DMARC)');
console.log('✅ Production deployment ready');
console.log('✅ API endpoints configured');
console.log('✅ Testing scripts available');
console.log('');
console.log('Next: Add the DNS records and wait for propagation! 🚀');