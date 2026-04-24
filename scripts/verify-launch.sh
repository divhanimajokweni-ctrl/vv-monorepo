#!/bin/bash
# Production Launch Verification Script
# Run this after domain connection to verify everything is working

set -euo pipefail

PRIMARY_DOMAIN="${PRIMARY_DOMAIN:-venturevisionubuntu.co.za}"
API_DOMAIN="${API_DOMAIN:-api.venturevisionubuntu.co.za}"

echo "🚀 Venture Vision Ubuntu Production Launch Verification"
echo "======================================================"
echo "Domain: $PRIMARY_DOMAIN"
echo "API: $API_DOMAIN"
echo ""

# Test 1: Dashboard accessibility
echo "🖥️  Test 1: Dashboard Accessibility"
DASHBOARD_STATUS=$(curl -s -w "%{http_code}" -o /dev/null "https://$PRIMARY_DOMAIN" --max-time 10)

if [ "$DASHBOARD_STATUS" = "200" ]; then
    echo "✅ Dashboard: ACCESSIBLE (Status: $DASHBOARD_STATUS)"
else
    echo "❌ Dashboard: FAILED (Status: $DASHBOARD_STATUS)"
    echo "   This may be normal during DNS propagation (wait 5-15 minutes)"
fi

# Test 2: API Health Check
echo ""
echo "🔧 Test 2: API Health Check"
HEALTH_RESPONSE=$(curl -s "https://$API_DOMAIN/health" --max-time 10)
HEALTH_STATUS=$?

if [ $HEALTH_STATUS -eq 0 ] && echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    echo "✅ API Health: OK"
    echo "   Response: $(echo $HEALTH_RESPONSE | jq -r '.status') at $(echo $HEALTH_RESPONSE | jq -r '.timestamp')"
else
    echo "❌ API Health: FAILED"
    echo "   Response: $HEALTH_RESPONSE"
fi

# Test 3: SSL Certificate
echo ""
echo "🔒 Test 3: SSL Certificate Validation"
SSL_INFO=$(curl -s -I "https://$PRIMARY_DOMAIN" --max-time 10 | grep -i "strict-transport-security\|server:" || true)

if echo "$SSL_INFO" | grep -q "strict-transport-security"; then
    echo "✅ SSL: ACTIVE (HSTS enabled)"
else
    echo "⚠️  SSL: Checking... (may take 1-2 minutes after DNS propagation)"
fi

# Test 4: API Endpoints
echo ""
echo "🔌 Test 4: API Endpoint Availability"

# Test sign endpoint (will fail without proper auth, but should not be 404)
SIGN_TEST=$(curl -s -w "%{http_code}" -o /dev/null -X POST "https://$API_DOMAIN/sign" \
    -H "Content-Type: application/json" \
    -d '{"payload":{"test":"data"},"keyId":"safe-stakes-executor-key"}' \
    --max-time 10)

if [ "$SIGN_TEST" = "400" ]; then
    echo "✅ Sign Endpoint: RESPONDING (Auth required, as expected)"
elif [ "$SIGN_TEST" = "200" ]; then
    echo "✅ Sign Endpoint: FULLY OPERATIONAL"
else
    echo "❌ Sign Endpoint: FAILED (Status: $SIGN_TEST)"
fi

# Test verify endpoint
VERIFY_TEST=$(curl -s -w "%{http_code}" -o /dev/null -X POST "https://$API_DOMAIN/verify" \
    -H "Content-Type: application/json" \
    -d '{"payload":{"test":"data"},"signature":"test","signerPubKey":"test"}' \
    --max-time 10)

if [ "$VERIFY_TEST" = "400" ] || [ "$VERIFY_TEST" = "200" ]; then
    echo "✅ Verify Endpoint: RESPONDING"
else
    echo "❌ Verify Endpoint: FAILED (Status: $VERIFY_TEST)"
fi

# Summary
echo ""
echo "📊 Launch Verification Summary"
echo "=============================="

if [ "$DASHBOARD_STATUS" = "200" ] && [ $HEALTH_STATUS -eq 0 ]; then
    echo "🎉 SYSTEM IS LIVE AND OPERATIONAL!"
    echo ""
    echo "🌐 Public URLs:"
    echo "   Dashboard: https://$PRIMARY_DOMAIN"
    echo "   API: https://$API_DOMAIN"
    echo "   Health: https://$API_DOMAIN/health"
    echo ""
    echo "📞 Next Steps:"
    echo "   1. Notify UBUNTUctrl Committee"
    echo "   2. Send underwriter invitations"
    echo "   3. Begin premium collection (Capitec Account 2486632030)"
    echo "   4. Monitor with: npm run monitor-production"
    echo ""
    echo "💚 Venture Vision Ubuntu is now live in production!"
else
    echo "⏳ System is deploying or DNS is propagating..."
    echo "   Wait 5-15 minutes and run this script again."
    echo "   Check Vercel dashboard for deployment status."
fi