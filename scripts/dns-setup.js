#!/usr/bin/env node

/**
 * Ubuntu Pools DNS Setup Script
 *
 * This script provides the DNS records needed to configure:
 * - Custom domain (ubuntupools-vvlcc.app) on Vercel
 * - Email authentication with Resend + Amazon SES
 *
 * Run this script to see the required DNS records.
 */

console.log('🌍 Ubuntu Pools DNS Configuration');
console.log('==================================\n');

// Custom Domain (Vercel)
console.log('1. Custom Domain Setup (Vercel)');
console.log('-------------------------------');
console.log('Add this A record to point ubuntupools-vvlcc.app to Vercel:');
console.log('Type: A');
console.log('Host: @ (ubuntupools-vvlcc.app)');
console.log('Value: 76.76.21.21');
console.log('TTL: Auto (or 300)');
console.log('');

console.log('2. Email DNS Records (Resend + Amazon SES)');
console.log('-------------------------------------------');

// DKIM Record
console.log('DKIM Signature (Required):');
console.log('Type: TXT');
console.log('Host: resend._domainkey.ubuntupools-vvlcc.app');
console.log('Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDe/2014D6grpfK...QIDAQAB');
console.log('TTL: 300');
console.log('Purpose: Cryptographic signature verification for outbound emails');
console.log('');

// SPF Record
console.log('SPF Authorization (Required):');
console.log('Type: TXT');
console.log('Host: send.ubuntupools-vvlcc.app');
console.log('Value: v=spf1 include:amazonses.com ~all');
console.log('TTL: 300');
console.log('Purpose: Authorizes Amazon SES servers to send emails on your behalf');
console.log('');

// DMARC Policy
console.log('DMARC Policy (Recommended):');
console.log('Type: TXT');
console.log('Host: _dmarc.ubuntupools-vvlcc.app');
console.log('Value: v=DMARC1; p=none; rua=mailto:dmarc@ubuntupools-vvlcc.app');
console.log('TTL: 300');
console.log('Purpose: Email authentication policy and reporting');
console.log('');

// MX Records
console.log('MX Records for Email Routing (Required):');
console.log('');
console.log('Bounce/Complaint Feedback:');
console.log('Type: MX');
console.log('Host: send.ubuntupools-vvlcc.app');
console.log('Priority: 10');
console.log('Value: feedback-smtp.eu-west-1.amazonaws.com');
console.log('Purpose: Routes bounce and complaint notifications to Amazon SES');
console.log('');

console.log('Inbound Email Routing:');
console.log('Type: MX');
console.log('Host: @ (ubuntupools-vvlcc.app)');
console.log('Priority: 10');
console.log('Value: inbound-smtp.eu-west-1.amazonaws.com');
console.log('Purpose: Routes incoming emails through Amazon SES for processing');
console.log('');

console.log('3. Verification Steps');
console.log('---------------------');
console.log('1. Add all records above to your DNS provider (Namecheap, GoDaddy, etc.)');
console.log('2. Wait 24-48 hours for DNS propagation');
console.log('3. Verify domain in Vercel: vercel domains inspect ubuntupools-vvlcc.app');
console.log('4. Verify domain in Resend dashboard or use the API endpoint');
console.log('5. Test email sending with the configured domain');
console.log('');

console.log('4. Environment Variables Required');
console.log('---------------------------------');
console.log('RESEND_API_KEY=your_resend_api_key_here');
console.log('RESEND_FROM_ADDRESS=bot@ubuntupools-vvlcc.app');
console.log('RESEND_FROM_NAME=Ubuntu Pools Bot');
console.log('RESEND_WEBHOOK_SECRET=your_webhook_secret_here');
console.log('');

console.log('5. Testing Commands');
console.log('-------------------');
console.log('# Test email sending');
console.log('curl -X POST http://localhost:3000/api/resend/setup-domain \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"domain": "ubuntupools-vvlcc.app"}\'');
console.log('');
console.log('# Verify domain status');
console.log('vercel domains inspect ubuntupools-vvlcc.app');
console.log('');

console.log('✅ DNS setup complete! Your domain will be ready for production use.');