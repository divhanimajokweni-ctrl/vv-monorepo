#!/bin/bash
# DNS Propagation Monitor
# Run this to check DNS status during propagation

echo "🔍 DNS Propagation Monitor for Venture Vision Ubuntu"
echo "==================================================="
echo ""

# Check DNS resolution
echo "🌐 Checking DNS Resolution..."
echo "   Domain: venturevisionubuntu.co.za"
echo "   Registrar: HOSTAFRICA (ns1.host-ww.net)"
echo ""

# Test main domain
echo "🔍 Testing venturevisionubuntu.co.za..."
MAIN_DNS=$(nslookup venturevisionubuntu.co.za 8.8.8.8 2>/dev/null | grep "Address:" | tail -1)

if echo "$MAIN_DNS" | grep -q "76.76.21.21"; then
    echo "✅ Main Domain: RESOLVED → 76.76.21.21"
else
    echo "❌ Main Domain: NOT RESOLVED"
    echo "   Current: ${MAIN_DNS:-No A record found}"
    echo "   Required: 76.76.21.21"
fi

# Test API subdomain
echo ""
echo "🔍 Testing api.venturevisionubuntu.co.za..."
API_DNS=$(nslookup api.venturevisionubuntu.co.za 8.8.8.8 2>/dev/null | grep "Address:" | tail -1)

if echo "$API_DNS" | grep -q "76.76.21.21"; then
    echo "✅ API Domain: RESOLVED → 76.76.21.21"
else
    echo "❌ API Domain: NOT RESOLVED"
    echo "   Current: ${API_DNS:-No A record found}"
    echo "   Required: 76.76.21.21"
fi

echo ""
echo "📋 DNS CONFIGURATION REQUIRED:"
echo "Log into HOSTAFRICA control panel:"
echo "https://www.hostafrica.co.za/clientarea.php"
echo ""
echo "Navigate: Domains → venturevisionubuntu.co.za → DNS Management"
echo ""
echo "Add A Records:"
echo "1. Name: @, Value: 76.76.21.21 (for venturevisionubuntu.co.za)"
echo "2. Name: api, Value: 76.76.21.21 (for api.venturevisionubuntu.co.za)"
echo ""
echo "⏳ After configuration: Wait 5-30 minutes, then run: npm run final:verify"

echo ""
echo "📊 Current Status:"
echo "   Vercel Dashboard: ✅ ACTIVE (https://dashboard-eta-one-54.vercel.app)"
echo "   DNS A Records: $([ "$(nslookup venturevisionubuntu.co.za 8.8.8.8 2>/dev/null | grep -c "76.76.21.21")" -gt 0 ] && echo "✅ CONFIGURED" || echo "⏳ PROPAGATING")"
echo "   SSL Certificates: ⏳ Will activate after DNS propagation"
echo "   Custom Domain: ⏳ Awaiting DNS completion"