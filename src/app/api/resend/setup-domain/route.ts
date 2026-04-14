import { NextResponse } from 'next/server';
import { addDomain, retrieveDomain, getDomainDNSRecords } from '@/lib/resend-domains';

export async function POST(request: Request) {
  try {
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    // First check if domain already exists
    const listResult = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const domains = await listResult.json();
    const existingDomain = domains.data?.find((d: any) => d.name === domain);

    let domainId: string;
    let domainDetails: any;

    if (existingDomain) {
      console.log('Domain already exists, retrieving details...');
      domainId = existingDomain.id;
      domainDetails = await retrieveDomain(domainId);
    } else {
      console.log('Adding new domain to Resend...');
      // Add domain to Resend
      const addResult = await addDomain(domain);

      if (addResult.error) {
        return NextResponse.json({ error: addResult.error.message }, { status: 400 });
      }

      // Get domain details
      domainId = addResult.data?.id;
      if (!domainId) {
        return NextResponse.json({ error: 'Failed to get domain ID' }, { status: 500 });
      }

      domainDetails = await retrieveDomain(domainId);
    }

    // Get DNS records from Resend
    const dnsRecords = await getDomainDNSRecords(domainId);

    return NextResponse.json({
      success: true,
      domain: domainDetails.data,
      dns_records: dnsRecords.data,
      setup_instructions: {
        message: 'Domain configured in Resend. Now add these DNS records to your domain registrar:',
        vercel_domain: {
          type: 'A',
          host: '@',
          value: '76.76.21.21',
          purpose: 'Points your domain to Vercel for hosting'
        },
        email_records: [
          {
            type: 'TXT',
            host: 'resend._domainkey',
            value: (dnsRecords.data as any)?.dkim_key || 'Contact Resend support to get DKIM key',
            purpose: 'DKIM signature verification for outbound emails'
          },
          {
            type: 'TXT',
            host: 'send',
            value: 'v=spf1 include:amazonses.com ~all',
            purpose: 'SPF authorization for Amazon SES'
          },
          {
            type: 'TXT',
            host: '_dmarc',
            value: 'v=DMARC1; p=none; rua=mailto:dmarc@ubuntupools-vvlcc.app',
            purpose: 'DMARC policy for email authentication'
          },
          {
            type: 'MX',
            host: 'send',
            value: '10 feedback-smtp.eu-west-1.amazonaws.com',
            purpose: 'Bounce/complaint feedback routing'
          },
          {
            type: 'MX',
            host: '@',
            value: '10 inbound-smtp.eu-west-1.amazonaws.com',
            purpose: 'Inbound email routing via SES'
          }
        ],
        next_steps: [
          '1. Add the A record to point your domain to Vercel',
          '2. Add all email DNS records to your domain registrar',
          '3. Wait 24-48 hours for DNS propagation',
          '4. Verify domain in Resend dashboard',
          '5. Test email sending functionality'
        ]
      }
    });
  } catch (error) {
    console.error('Domain setup error:', error);
    return NextResponse.json({ error: 'Failed to set up domain', details: (error as Error).message }, { status: 500 });
  }
}