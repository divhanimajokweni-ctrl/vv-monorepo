# DNS Records for ubuntuvvlcc.com

## A Records
- **Name:** @
- **Type:** A
- **Value:** 76.76.21.21
- **TTL:** 3600

- **Name:** @
- **Type:** A
- **Value:** 76.76.21.22
- **TTL:** 3600

## CNAME Records
- **Name:** www
- **Type:** CNAME
- **Value:** cname.vercel-dns.com
- **TTL:** 3600

## TXT Records
- **Name:** @
- **Type:** TXT
- **Value:** "v=spf1 include:spf.resend.com -all"
- **TTL:** 3600

- **Name:** _dmarc
- **Type:** TXT
- **Value:** "v=DMARC1; p=quarantine; rua=mailto:dmarc@ubuntuvvlcc.com"
- **TTL:** 3600

## CNAME Records for DKIM
- **Name:** resend._domainkey
- **Type:** CNAME
- **Value:** resend._domainkey.resend.com
- **TTL:** 3600

## NS Records
- **Name:** @
- **Type:** NS
- **Value:** ns1.ubuntuvvlcc.com
- **TTL:** 3600

- **Name:** @
- **Type:** NS
- **Value:** ns2.ubuntuvvlcc.com
- **TTL:** 3600

## SOA Record
- **Name:** @
- **Type:** SOA
- **Primary NS:** ns1.ubuntuvvlcc.com
- **Responsible Email:** admin.ubuntuvvlcc.com
- **Serial:** 2026041301
- **Refresh:** 3600
- **Retry:** 1800
- **Expire:** 604800
- **Minimum TTL:** 86400