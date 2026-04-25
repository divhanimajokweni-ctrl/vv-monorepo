#!/bin/bash
# Railway Deployment Script for Venture Vision Ubuntu
# Execute this to deploy to Railway

set -euo pipefail

echo "🚂 Railway Deployment — Venture Vision Ubuntu"
echo "=============================================="
echo ""

# Check if Railway CLI is available
if command -v railway &> /dev/null; then
    echo "✅ Railway CLI detected"
    CLI_AVAILABLE=true
else
    echo "⚠️  Railway CLI not found - will provide web interface instructions"
    CLI_AVAILABLE=false
fi

echo ""
echo "📋 RAILWAY DEPLOYMENT STEPS:"
echo "============================"
echo ""

if [ "$CLI_AVAILABLE" = true ]; then
    echo "🔧 CLI Deployment Path:"
    echo "1. Login to Railway:"
    echo "   railway login"
    echo ""
    echo "2. Link this project:"
    echo "   railway link"
    echo ""
    echo "3. Add environment variables:"
    echo "   railway variables set DATABASE_URL=\"$DATABASE_URL\""
    echo "   railway variables set SUPABASE_URL=\"$SUPABASE_URL\""
    echo "   railway variables set SUPABASE_ANON_KEY=\"$SUPABASE_ANON_KEY\""
    echo "   # ... add all variables from .env.production"
    echo ""
    echo "4. Deploy:"
    echo "   railway up"
    echo ""
else
    echo "🌐 Web Interface Deployment Path:"
    echo ""
    echo "1. 🌐 Go to: https://railway.app"
    echo "2. 🔗 Connect GitHub repository: divhanimajokweni-ctrl/ubuntu-pools"
    echo "3. 🚀 Click 'Deploy' (Railway auto-detects package.json)"
    echo "4. ⚙️  Add Environment Variables in Railway dashboard:"
    echo ""
    cat << 'EOF'
   DATABASE_URL=postgresql://[supabase-connection-string]
   SUPABASE_URL=https://[project-ref].supabase.co
   SUPABASE_ANON_KEY=[anon-key]
   SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
   SAFEKRYPTE_SERVICE_PRIVATE_KEY=[ed25519-hex-key]
   SAFEKRYPTE_ARBITER_PRIVATE_KEY=[ed25519-hex-key]
   SAFEKRYPTE_EXECUTOR_PRIVATE_KEY=[ed25519-hex-key]
   SAFEKRYPTE_SHADOW_PRIVATE_KEY=[ed25519-hex-key]
   SAFEKRYPTE_TRUSTEE1_PRIVATE_KEY=[ed25519-hex-key]
   # ... add all 13 SAFEKRYPTE_*_PRIVATE_KEY variables
   DEPLOYMENT_ENV=production
   DEPLOYMENT_VERSION=1.0.0
EOF
    echo ""
    echo "5. 🎯 Railway provides instant railway.app URL"
    echo "6. 🌐 Add Custom Domain in Railway Settings:"
    echo "   - Domain: venturevisionubuntu.co.za"
    echo "   - Railway provides CNAME target"
    echo ""
    echo "7. 🔄 Update DNS in HOSTAFRICA:"
    echo "   - CNAME: venturevisionubuntu.co.za → [railway-cname-target]"
    echo "   - CNAME: api.venturevisionubuntu.co.za → [railway-cname-target]"
    echo ""
fi

echo ""
echo "⏱️  DEPLOYMENT TIMELINE:"
echo "======================="
echo "• Account Setup: 2 minutes"
echo "• GitHub Connect: 2 minutes"
echo "• Environment Config: 5 minutes"
echo "• Initial Deploy: 3 minutes"
echo "• Custom Domain: 5 minutes"
echo "• DNS Update: 5 minutes"
echo "• SSL Activation: 1 minute"
echo ""
echo "🎯 TOTAL: 23 minutes to live production"
echo ""

echo "📞 POST-DEPLOYMENT VERIFICATION:"
echo "================================="
echo "Run after Railway reports successful deployment:"
echo ""
echo "npm run final:verify"
echo ""
echo "Expected output:"
echo "🎉 VENTURE VISION UBUNTU IS FULLY LIVE!"
echo "🌐 Dashboard: https://venturevisionubuntu.co.za"
echo "🔗 API: https://api.venturevisionubuntu.co.za/health"
echo ""

echo "🚨 IF ISSUES:"
echo "============="
echo "• Check Railway deployment logs"
echo "• Verify environment variables"
echo "• Confirm database connectivity"
echo "• Test with Railway's generated URL first"
echo ""

echo "💰 BUSINESS READY:"
echo "=================="
echo "• Premium Deposits: Capitec 2486632030 ✅"
echo "• Underwriter Onboarding: Dashboard interface ✅"
echo "• Reporter Registration: Signup forms ✅"
echo "• Governance Operations: UBUNTUctrl Committee ✅"
echo ""

echo "🎉 EXECUTE RAILWAY DEPLOYMENT NOW!"
echo "System live in 30 minutes. 🏛️🚀"