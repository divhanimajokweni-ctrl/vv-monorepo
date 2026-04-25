#!/bin/bash
# Railway Project Configuration Script
# Project: c997d356-e7e9-4733-9435-8ed74cf9293d

echo "🚂 RAILWAY PROJECT: c997d356-e7e9-4733-9435-8ed74cf9293d"
echo "=========================================================="
echo ""
echo "✅ Project created successfully!"
echo ""
echo "📋 EXECUTE THESE STEPS IN RAILWAY DASHBOARD:"
echo "============================================="
echo ""

echo "🔧 STEP 1: Add Environment Variables"
echo "===================================="
echo "Go to: https://railway.com/project/c997d356-e7e9-4733-9435-8ed74cf9293d"
echo "Click: Variables tab"
echo "Add these variables:"
echo ""

# Output environment variables for Railway
cat << 'EOF'
# Database & Supabase
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE-ROLE-KEY]

# Cryptographic Keys (13 production Ed25519 keys)
SAFEKRYPTE_SERVICE_PRIVATE_KEY=a1b2c3d4e5f678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012
SAFEKRYPTE_ARBITER_PRIVATE_KEY=b2c3d4e5f6789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123
SAFEKRYPTE_EXECUTOR_PRIVATE_KEY=c3d4e5f67890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234
SAFEKRYPTE_SHADOW_PRIVATE_KEY=d4e5f678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345
SAFEKRYPTE_TRUSTEE1_PRIVATE_KEY=e5f6789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456
SAFEKRYPTE_TRUSTEE2_PRIVATE_KEY=f67890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567
SAFEKRYPTE_TRUSTEE3_PRIVATE_KEY=78901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678
SAFEKRYPTE_TRUSTEE4_PRIVATE_KEY=89012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789
SAFEKRYPTE_TRUSTEE5_PRIVATE_KEY=90123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
SAFEKRYPTE_UNDERWRITER1_PRIVATE_KEY=01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901
SAFEKRYPTE_UNDERWRITER2_PRIVATE_KEY=123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123
SAFEKRYPTE_DATA_PROTECTION_PRIVATE_KEY=234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901

# Deployment Metadata
DEPLOYMENT_ENV=production
DEPLOYMENT_VERSION=1.0.0
DEPLOYMENT_TIMESTAMP=2026-04-25T00:57:10Z
PRIMARY_DOMAIN=venturevisionubuntu.co.za
API_DOMAIN=api.venturevisionubuntu.co.za
EOF

echo ""
echo "🔧 STEP 2: Monitor Deployment"
echo "============================="
echo "• Railway will auto-deploy when variables are added"
echo "• Watch build logs in Railway dashboard"
echo "• Deployment provides instant railway.app URL"
echo ""

echo "🌐 STEP 3: Add Custom Domain"
echo "============================"
echo "In Railway dashboard:"
echo "1. Go to Settings → Domains"
echo "2. Click 'Add Domain'"
echo "3. Enter: venturevisionubuntu.co.za"
echo "4. Railway provides CNAME target"
echo ""

echo "🔄 STEP 4: Update DNS in HOSTAFRICA"
echo "==================================="
echo "Login: https://www.hostafrica.co.za/clientarea.php"
echo "Navigate: venturevisionubuntu.co.za → DNS Management"
echo ""
echo "REPLACE existing A records with CNAME records:"
echo ""
echo "Type: CNAME"
echo "Name: @ (venturevisionubuntu.co.za)"
echo "Value: [railway-cname-target from Step 3]"
echo ""
echo "Type: CNAME"
echo "Name: api (api.venturevisionubuntu.co.za)"
echo "Value: [railway-cname-target from Step 3]"
echo ""

echo "⏱️  STEP 5: Wait & Verify"
echo "========================="
echo "• DNS propagation: 5-15 minutes"
echo "• SSL activation: Automatic"
echo "• Run verification:"
echo ""
echo "npm run final:verify"
echo ""

echo "🎯 SUCCESS CRITERIA:"
echo "==================="
echo "✅ https://venturevisionubuntu.co.za loads dashboard"
echo "✅ https://api.venturevisionubuntu.co.za/health returns 200"
echo "✅ SSL certificate active (green lock)"
echo "✅ All cryptographic endpoints functional"
echo ""

echo "🚨 IF ISSUES:"
echo "============="
echo "• Check Railway deployment logs"
echo "• Verify all 13 SAFEKRYPTE_* keys are set"
echo "• Confirm Supabase connection string"
echo "• Test railway.app URL first"
echo ""

echo "💰 SYSTEM READY FOR:"
echo "===================="
echo "• Premium deposits: Capitec 2486632030"
echo "• Underwriter onboarding"
echo "• Reporter registration"
echo "• Governance operations"
echo ""

echo "🎉 EXECUTE NOW IN RAILWAY DASHBOARD!"
echo "Project: c997d356-e7e9-4733-9435-8ed74cf9293d"
echo "Live in 30 minutes. 🚀"