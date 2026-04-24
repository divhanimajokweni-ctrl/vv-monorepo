#!/bin/bash
# Domain Connection Script for Venture Vision Ubuntu
# Run this after Vercel deployments are complete

set -euo pipefail

echo "🌐 Connecting venturevisionubuntu.co.za to Vercel"
echo "================================================="

# Check if Vercel CLI is installed and authenticated
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not installed. Run: npm i -g vercel"
    exit 1
fi

if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged into Vercel. Run: vercel login"
    exit 1
fi

echo "✅ Vercel CLI ready"

# Get deployment URLs (assuming deployments are done)
echo ""
echo "📋 Current Deployment Status:"
echo "-----------------------------"

# Check dashboard deployment
if [ -d "packages/dashboard" ]; then
    cd packages/dashboard
    DASHBOARD_URL=$(vercel ls --prod 2>/dev/null | grep -o 'https://[^ ]*' | head -1 || echo "Not deployed")
    echo "Dashboard: $DASHBOARD_URL"
    cd ../..
else
    echo "Dashboard: No dashboard package found"
fi

# Check API deployment
if [ -d "packages/api" ]; then
    cd packages/api
    API_URL=$(vercel ls --prod 2>/dev/null | grep -o 'https://[^ ]*' | head -1 || echo "Not deployed")
    echo "API: $API_URL"
    cd ../..
else
    echo "API: No API package found"
fi

echo ""
echo "🔧 Domain Connection Instructions:"
echo "=================================="
echo ""
echo "1. Go to https://vercel.com/dashboard"
echo "2. Open your 'Lindiwe Dashboard' project"
echo "3. Go to Settings → Domains"
echo "4. Add: venturevisionubuntu.co.za"
echo "5. Vercel will show required DNS records"
echo ""
echo "6. Update DNS at your domain registrar:"
echo "   - Either change nameservers to:"
echo "     * ns1.vercel-dns.com"
echo "     * ns2.vercel-dns.com"
echo "   - Or add CNAME record: venturevisionubuntu.co.za → cname.vercel-dns.com"
echo ""
echo "7. For API subdomain, repeat steps 2-6 for 'api.venturevisionubuntu.co.za'"
echo ""
echo "8. Wait 5-15 minutes for DNS propagation"
echo ""
echo "9. Test with:"
echo "   curl https://venturevisionubuntu.co.za"
echo "   curl https://api.venturevisionubuntu.co.za/health"
echo ""
echo "🎉 System will be live at https://venturevisionubuntu.co.za"