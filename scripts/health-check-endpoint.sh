#!/bin/bash

# Health Check Endpoint Script
# Tests the application health endpoint and reports status

HEALTH_URL="${1:-http://localhost:3000/api/health}"
TIMEOUT=5

echo "=== Application Health Check ==="
echo "Endpoint: $HEALTH_URL"
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Perform health check
RESPONSE=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT "$HEALTH_URL" 2>&1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ Health check PASSED"
    echo "HTTP Status: $HTTP_CODE"
    echo "Response: $BODY"
    exit 0
else
    echo "✗ Health check FAILED"
    echo "HTTP Status: $HTTP_CODE"
    echo "Response: $BODY"
    exit 1
fi
