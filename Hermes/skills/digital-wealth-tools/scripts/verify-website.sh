#!/bin/bash
# Quick verification script for DigitallyDefined website
# Run after deployment to check all endpoints

set -e

BASE_URL="https://digitallydefined.online"

echo "=== DigitallyDefined Verification ==="
echo "Date: $(date)"
echo ""

# Test all pages
echo "Testing pages..."
for page in "/" "/start-here" "/quiz" "/tools" "/scorecard" "/roi" "/freedom" "/gap" "/products" "/pricing" "/about" "/contact"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$page")
  if [ "$status" = "200" ]; then
    echo "  ✓ $page (200)"
  else
    echo "  ✗ $page ($status)"
  fi
done

echo ""
echo "Testing APIs..."
# Test email signup
subscribe_result=$(curl -s -X POST "$BASE_URL/api/subscribe" \
  -H "Content-Type: application/json" \
  -d '{"email":"verify@digitallydefined.test"}')
if echo "$subscribe_result" | grep -q '"success":true'; then
  echo "  ✓ /api/subscribe"
else
  echo "  ✗ /api/subscribe"
fi

# Test contact form
contact_result=$(curl -s -X POST "$BASE_URL/api/contact" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","message":"Hi"}')
if echo "$contact_result" | grep -q '"success":true'; then
  echo "  ✓ /api/contact"
else
  echo "  ✗ /api/contact"
fi

# Test Hermes API
hermes_result=$(curl -s -X POST "$BASE_URL/api/hermes" \
  -H "x-api-key: DigitallyDefined-OS-2026" \
  -d '{"action":"dashboard"}')
if echo "$hermes_result" | grep -q '"revenue"'; then
  echo "  ✓ /api/hermes"
else
  echo "  ✗ /api/hermes"
fi

echo ""
echo "Done."