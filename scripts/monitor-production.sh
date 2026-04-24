#!/bin/bash
# Production monitoring script
# Run this periodically to check system health

API_URL="${API_URL:-https://api.venturevisionubuntu.co.za}"
DASHBOARD_URL="${DASHBOARD_URL:-https://venturevisionubuntu.co.za}"

echo "🔍 Production Health Check - $(date)"
echo "====================================="

# Check API health
echo "Checking API health..."
HEALTH_STATUS=$(curl -s -w "%{http_code}" -o /dev/null "$API_URL/health")

if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✅ API Health: OK"
else
    echo "❌ API Health: FAILED (Status: $HEALTH_STATUS)"
    # Send alert (integrate with your alerting system)
fi

# Check dashboard accessibility
echo "Checking dashboard accessibility..."
DASHBOARD_STATUS=$(curl -s -w "%{http_code}" -o /dev/null "$DASHBOARD_URL")

if [ "$DASHBOARD_STATUS" = "200" ]; then
    echo "✅ Dashboard: OK"
else
    echo "❌ Dashboard: FAILED (Status: $DASHBOARD_STATUS)"
fi

# Check database connectivity (if you have a status endpoint)
echo "Checking database connectivity..."
# Add database health check if available

# Check CI/CD pipeline status
echo "Checking CI/CD status..."
# Add GitHub API check for latest workflow status

echo ""
echo "Health check complete."