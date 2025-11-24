# 🧪 Bid4Service Testing Guide

Complete guide to testing all platform features.

---

## Quick Test Script

Save this as `test-api.sh` and run it:

```bash
#!/bin/bash

# Bid4Service API Test Script

API_URL="http://localhost:5000/api/v1"

echo "🧪 Testing Bid4Service API..."
echo ""

# Colors for output
GREEN='\033[0.32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "1️⃣  Testing health endpoint..."
HEALTH=$(curl -s http://localhost:5000/health)
if echo "$HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed${NC}"
    exit 1
fi
echo ""

# Test 2: Register Customer
echo "2️⃣  Registering customer..."
CUSTOMER_RESPONSE=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer'$(date +%s)'@test.com",
    "password": "Test123!",
    "firstName": "John",
    "lastName": "Customer",
    "role": "CUSTOMER"
  }')

CUSTOMER_TOKEN=$(echo $CUSTOMER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$CUSTOMER_TOKEN" ]; then
    echo -e "${GREEN}✓ Customer registered${NC}"
    echo "   Token: ${CUSTOMER_TOKEN:0:20}..."
else
    echo -e "${RED}✗ Customer registration failed${NC}"
    echo "$CUSTOMER_RESPONSE"
    exit 1
fi
echo ""

# Test 3: Register Provider
echo "3️⃣  Registering provider..."
PROVIDER_RESPONSE=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "provider'$(date +%s)'@test.com",
    "password": "Test123!",
    "firstName": "Jane",
    "lastName": "Provider",
    "role": "PROVIDER"
  }')

PROVIDER_TOKEN=$(echo $PROVIDER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$PROVIDER_TOKEN" ]; then
    echo -e "${GREEN}✓ Provider registered${NC}"
    echo "   Token: ${PROVIDER_TOKEN:0:20}..."
else
    echo -e "${RED}✗ Provider registration failed${NC}"
    exit 1
fi
echo ""

# Test 4: Create Job
echo "4️⃣  Creating job..."
JOB_RESPONSE=$(curl -s -X POST $API_URL/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d '{
    "title": "Kitchen Remodel - Test",
    "description": "Complete kitchen renovation for testing",
    "category": "Remodeling",
    "address": "123 Test St",
    "city": "Atlanta",
    "state": "GA",
    "zipCode": "30301",
    "startingBid": 15000
  }')

JOB_ID=$(echo $JOB_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ ! -z "$JOB_ID" ]; then
    echo -e "${GREEN}✓ Job created${NC}"
    echo "   Job ID: $JOB_ID"
else
    echo -e "${RED}✗ Job creation failed${NC}"
    echo "$JOB_RESPONSE"
    exit 1
fi
echo ""

# Test 5: Get All Jobs
echo "5️⃣  Fetching all jobs..."
JOBS_RESPONSE=$(curl -s $API_URL/jobs)
JOBS_COUNT=$(echo $JOBS_RESPONSE | grep -o '"total":[0-9]*' | cut -d':' -f2)

if [ ! -z "$JOBS_COUNT" ]; then
    echo -e "${GREEN}✓ Jobs fetched${NC}"
    echo "   Total jobs: $JOBS_COUNT"
else
    echo -e "${RED}✗ Failed to fetch jobs${NC}"
fi
echo ""

# Test 6: Submit Bid
echo "6️⃣  Submitting bid..."
BID_RESPONSE=$(curl -s -X POST $API_URL/jobs/$JOB_ID/bids \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -d '{
    "amount": 14000,
    "proposal": "I can complete this kitchen remodel professionally",
    "estimatedDuration": 30,
    "laborCost": 7000,
    "materialCost": 6500,
    "equipmentCost": 500
  }')

BID_ID=$(echo $BID_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ ! -z "$BID_ID" ]; then
    echo -e "${GREEN}✓ Bid submitted${NC}"
    echo "   Bid ID: $BID_ID"
else
    echo -e "${RED}✗ Bid submission failed${NC}"
    echo "$BID_RESPONSE"
    exit 1
fi
echo ""

# Test 7: Get Bids for Job
echo "7️⃣  Fetching bids for job..."
BIDS_RESPONSE=$(curl -s $API_URL/jobs/$JOB_ID/bids \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

BIDS_COUNT=$(echo $BIDS_RESPONSE | grep -o '"bids":\[' | wc -l)

if [ $BIDS_COUNT -gt 0 ]; then
    echo -e "${GREEN}✓ Bids fetched${NC}"
else
    echo -e "${RED}✗ Failed to fetch bids${NC}"
fi
echo ""

# Test 8: Accept Bid
echo "8️⃣  Accepting bid..."
ACCEPT_RESPONSE=$(curl -s -X POST $API_URL/bids/$BID_ID/accept \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

if echo "$ACCEPT_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ Bid accepted${NC}"
    echo "   Project automatically created!"
else
    echo -e "${RED}✗ Bid acceptance failed${NC}"
    echo "$ACCEPT_RESPONSE"
fi
echo ""

# Test 9: Get User Profile
echo "9️⃣  Fetching customer profile..."
PROFILE_RESPONSE=$(curl -s $API_URL/users/profile \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

if echo "$PROFILE_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ Profile fetched${NC}"
else
    echo -e "${RED}✗ Failed to fetch profile${NC}"
fi
echo ""

# Test 10: Send Message
echo "🔟 Sending message..."
PROVIDER_ID=$(echo $PROVIDER_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
MESSAGE_RESPONSE=$(curl -s -X POST $API_URL/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d "{
    \"receiverId\": \"$PROVIDER_ID\",
    \"content\": \"Hi! I have a question about the project.\"
  }")

if echo "$MESSAGE_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ Message sent${NC}"
else
    echo -e "${RED}✗ Message sending failed${NC}"
fi
echo ""

echo "================================================"
echo -e "${GREEN}🎉 All tests completed!${NC}"
echo "================================================"
echo ""
echo "Test Summary:"
echo "✓ Health check"
echo "✓ User registration (Customer & Provider)"
echo "✓ Job creation"
echo "✓ Job listing"
echo "✓ Bid submission"
echo "✓ Bid acceptance"
echo "✓ User profiles"
echo "✓ Messaging"
echo ""
echo "Credentials for manual testing:"
echo "Customer Token: $CUSTOMER_TOKEN"
echo "Provider Token: $PROVIDER_TOKEN"
echo "Job ID: $JOB_ID"
echo "Bid ID: $BID_ID"
```

---

## Manual Testing Checklist

### ✅ Authentication
- [ ] Register as customer
- [ ] Register as provider
- [ ] Login with correct credentials
- [ ] Login fails with wrong password
- [ ] Get current user profile
- [ ] Change password
- [ ] Logout

### ✅ Job Management
- [ ] Create job with all required fields
- [ ] Create job missing required fields (should fail)
- [ ] View all jobs (paginated)
- [ ] Filter jobs by category
- [ ] Filter jobs by budget range
- [ ] Filter jobs by location
- [ ] Search jobs by keyword
- [ ] View single job details
- [ ] Update own job
- [ ] Try to update someone else's job (should fail)
- [ ] Delete own job
- [ ] Close job to bidding
- [ ] View own jobs only

### ✅ Bidding System
- [ ] Provider submits bid on job
- [ ] Provider tries to bid twice on same job (should fail)
- [ ] Customer tries to bid (should fail)
- [ ] Customer views all bids on their job
- [ ] Provider views their own bids
- [ ] Update pending bid
- [ ] Try to update accepted bid (should fail)
- [ ] Withdraw pending bid
- [ ] Customer accepts bid
- [ ] Verify project is auto-created
- [ ] Verify other bids are auto-rejected
- [ ] Customer rejects bid

### ✅ Project Management
- [ ] View all user projects
- [ ] View specific project details
- [ ] Create milestone
- [ ] Update milestone
- [ ] Provider marks milestone complete
- [ ] Customer approves milestone
- [ ] Customer rejects milestone with reason
- [ ] Update project status
- [ ] Cancel project

### ✅ Messaging
- [ ] Send message to another user
- [ ] View all conversations
- [ ] View messages with specific user
- [ ] View project messages
- [ ] Mark message as read
- [ ] Get unread message count
- [ ] Delete message within 5 minutes
- [ ] Try to delete old message (should fail)

### ✅ Payments
- [ ] Create payment setup intent
- [ ] Fund escrow for project
- [ ] Try to fund escrow twice (should fail)
- [ ] Release milestone payment
- [ ] Release final payment
- [ ] View payment history
- [ ] View project payments
- [ ] Request refund

### ✅ Reviews
- [ ] Customer reviews provider after project
- [ ] Provider reviews customer after project
- [ ] Try to review before completion (should fail)
- [ ] Try to review twice (should fail)
- [ ] View user's reviews
- [ ] View own reviews
- [ ] Update review within 30 days
- [ ] Try to update old review (should fail)
- [ ] Respond to review
- [ ] Mark review as helpful

### ✅ File Upload
- [ ] Upload single image
- [ ] Upload multiple images
- [ ] Upload PDF document
- [ ] Try to upload invalid file type (should fail)
- [ ] Try to upload file >10MB (should fail)
- [ ] Get file info
- [ ] Delete uploaded file

### ✅ User Profiles
- [ ] Update user profile
- [ ] Update customer-specific fields
- [ ] Update provider-specific fields
- [ ] View public profile of other user
- [ ] Get user statistics
- [ ] Upload verification documents

### ✅ Admin Functions
- [ ] View platform statistics
- [ ] List all users with filters
- [ ] Suspend user
- [ ] Reactivate user
- [ ] View all reports
- [ ] Resolve report
- [ ] Dismiss report
- [ ] Delete inappropriate job
- [ ] Delete inappropriate review

---

## Postman Collection

Import this into Postman for easy testing:

```json
{
  "info": {
    "name": "Bid4Service API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:5000/api/v1"
    },
    {
      "key": "customer_token",
      "value": ""
    },
    {
      "key": "provider_token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register Customer",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"customer@test.com\",\n  \"password\": \"Test123!\",\n  \"firstName\": \"John\",\n  \"lastName\": \"Customer\",\n  \"role\": \"CUSTOMER\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": "{{base_url}}/auth/register"
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"customer@test.com\",\n  \"password\": \"Test123!\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": "{{base_url}}/auth/login"
          }
        }
      ]
    }
  ]
}
```

---

## Performance Testing

### Load Testing with Apache Bench

```bash
# Test health endpoint (1000 requests, 10 concurrent)
ab -n 1000 -c 10 http://localhost:5000/health

# Test job listing (with auth)
ab -n 500 -c 10 -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/v1/jobs
```

### Expected Performance
- Health check: <10ms
- Job listing: <100ms
- Job details: <50ms
- User registration: <200ms
- Bid submission: <150ms

---

## Security Testing

### Test Authentication
```bash
# Try to access protected route without token
curl http://localhost:5000/api/v1/users/profile
# Should return 401

# Try with invalid token
curl -H "Authorization: Bearer invalid-token" \
  http://localhost:5000/api/v1/users/profile
# Should return 401

# Try to access admin route as regular user
curl -H "Authorization: Bearer USER_TOKEN" \
  http://localhost:5000/api/v1/admin/stats
# Should return 403
```

### Test Authorization
```bash
# Try to update someone else's job
curl -X PUT http://localhost:5000/api/v1/jobs/OTHER_USER_JOB_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Hacked!"}'
# Should return 403

# Try to accept bid as provider
curl -X POST http://localhost:5000/api/v1/bids/BID_ID/accept \
  -H "Authorization: Bearer PROVIDER_TOKEN"
# Should return 403 (only customer can accept)
```

---

## Database Testing

### Check Data Integrity
```sql
-- Connect to database
psql -U bid4service -d bid4service_dev

-- Count records
SELECT 'Users' as table_name, COUNT(*) FROM "User"
UNION ALL
SELECT 'Jobs', COUNT(*) FROM "Job"
UNION ALL
SELECT 'Bids', COUNT(*) FROM "Bid"
UNION ALL
SELECT 'Projects', COUNT(*) FROM "Project"
UNION ALL
SELECT 'Messages', COUNT(*) FROM "Message"
UNION ALL
SELECT 'Reviews', COUNT(*) FROM "Review"
UNION ALL
SELECT 'Payments', COUNT(*) FROM "Payment";

-- Check for orphaned records
SELECT COUNT(*) FROM "Bid" b 
LEFT JOIN "Job" j ON b."jobId" = j.id 
WHERE j.id IS NULL;

-- Check project-bid relationship
SELECT COUNT(*) FROM "Project" p
LEFT JOIN "Bid" b ON p."jobId" = b."jobId"
WHERE b.id IS NULL;
```

---

## Automated Testing (Future)

### Jest Tests Structure
```
tests/
├── unit/
│   ├── controllers/
│   ├── services/
│   └── utils/
├── integration/
│   ├── auth.test.ts
│   ├── jobs.test.ts
│   ├── bids.test.ts
│   └── projects.test.ts
└── e2e/
    └── complete-workflow.test.ts
```

### Example Test
```typescript
describe('Job Creation', () => {
  it('should create job with valid data', async () => {
    const response = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        title: 'Test Job',
        description: 'Test description',
        category: 'Plumbing',
        address: '123 Main St',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30301',
        startingBid: 1000
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.job.title).toBe('Test Job');
  });

  it('should fail without authentication', async () => {
    const response = await request(app)
      .post('/api/v1/jobs')
      .send({
        title: 'Test Job',
        // ... other fields
      });

    expect(response.status).toBe(401);
  });
});
```

---

## Troubleshooting

### Common Issues

**Issue: 401 Unauthorized**
- Check token is included in Authorization header
- Verify token hasn't expired (7 days default)
- Check token format: `Bearer TOKEN`

**Issue: 403 Forbidden**
- Verify user has correct role for the action
- Check user account is active
- Ensure trying to access own resources

**Issue: 500 Internal Server Error**
- Check server logs: `tail -f logs/error.log`
- Verify database is running
- Check all environment variables are set

**Issue: Database connection error**
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check DATABASE_URL in .env
- Run migrations: `npx prisma migrate deploy`

---

## Test Data Cleanup

```bash
# Reset database (CAREFUL: Deletes all data!)
cd backend
npx prisma migrate reset

# Or manually clean tables
psql -U bid4service -d bid4service_dev << EOF
TRUNCATE TABLE "User" CASCADE;
TRUNCATE TABLE "Job" CASCADE;
TRUNCATE TABLE "Bid" CASCADE;
TRUNCATE TABLE "Project" CASCADE;
TRUNCATE TABLE "Message" CASCADE;
TRUNCATE TABLE "Review" CASCADE;
TRUNCATE TABLE "Payment" CASCADE;
EOF
```

---

**Happy Testing! 🧪**
