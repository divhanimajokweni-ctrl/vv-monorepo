$TTL 3600
@ IN SOA ns1.ubuntuvvlcc.com. admin.ubuntuvvlcc.com. (
  2026041301 ; serial
  3600 ; refresh
  1800 ; retry
  604800 ; expire
  86400 ; minimum
)
@ IN NS ns1.ubuntuvvlcc.com.
@ IN NS ns2.ubuntuvvlcc.com.

; A records for Vercel (replace with actual Vercel IPs if needed)
@ IN A 76.76.21.21
@ IN A 76.76.21.22

; CNAME for www
www IN CNAME cname.vercel-dns.com

; SPF for Resend
@ IN TXT "v=spf1 include:spf.resend.com -all"

; DKIM for Resend
resend._domainkey IN CNAME resend._domainkey.resend.com

; DMARC
_dmarc IN TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@ubuntuvvlcc.com"