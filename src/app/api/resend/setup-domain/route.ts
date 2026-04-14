import { NextResponse } from 'next/server';
import { addDomain, retrieveDomain } from '@/lib/resend-domains';

export async function POST(request: Request) {
  try {
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    // Add domain to Resend
    const addResult = await addDomain(domain);

    if (addResult.error) {
      return NextResponse.json({ error: addResult.error.message }, { status: 400 });
    }

    // Get domain details
    const domainId = addResult.data?.id;
    if (!domainId) {
      return NextResponse.json({ error: 'Failed to get domain ID' }, { status: 500 });
    }

    const domainDetails = await retrieveDomain(domainId);

    return NextResponse.json({
      success: true,
      domain: domainDetails.data,
      dns_instructions: {
        message: 'Please add the following DNS records to your domain registrar:',
        records: [
          {
            type: 'TXT',
            host: 'resend._domainkey',
            value: 'p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDe/2014D6grpfK...QIDAQAB',
            purpose: 'DKIM signature verification'
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
            purpose: 'Inbound email routing'
          }
        ]
      }
    });
  } catch (error) {
    console.error('Domain setup error:', error);
    return NextResponse.json({ error: 'Failed to set up domain' }, { status: 500 });
  }
}