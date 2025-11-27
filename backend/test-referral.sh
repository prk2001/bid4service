#!/bin/bash
echo "Logging in..."
RESPONSE=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patrick@test.com","password":"Test123!"}')

TOKEN=$(echo $RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])")
echo "Token: $TOKEN"

echo ""
echo "Testing referral link..."
curl -X GET "http://localhost:5000/api/v1/social/referrals/link" \
  -H "Authorization: Bearer $TOKEN"
echo ""
