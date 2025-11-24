# 📚 Bid4Service API Documentation

Complete API reference for the Bid4Service platform.

**Base URL:** `http://localhost:5000/api/v1` (development)  
**Production URL:** `https://your-domain.com/api/v1`

**Authentication:** Bearer token in Authorization header

---

## 🔐 Authentication

### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CUSTOMER", // or "PROVIDER"
  "phone": "5551234567"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "id": "...", "email": "...", ... },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer {token}
```

### Change Password
```http
PUT /api/v1/auth/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

---

## 👤 Users

### Get Profile
```http
GET /api/v1/users/profile
Authorization: Bearer {token}
```

### Update Profile
```http
PUT /api/v1/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "5551234567",
  "address": "123 Main St",
  "city": "Atlanta",
  "state": "GA",
  "zipCode": "30301"
}
```

### Get Public Profile
```http
GET /api/v1/users/{userId}
```

### Get User Statistics
```http
GET /api/v1/users/stats
Authorization: Bearer {token}
```

---

## 💼 Jobs

### Create Job (Customer only)
```http
POST /api/v1/jobs
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Kitchen Remodel",
  "description": "Complete kitchen renovation",
  "category": "Remodeling",
  "subcategory": "Kitchen",
  "address": "123 Main St",
  "city": "Atlanta",
  "state": "GA",
  "zipCode": "30301",
  "latitude": 33.7490,
  "longitude": -84.3880,
  "startingBid": 15000,
  "maxBudget": 25000,
  "urgency": "STANDARD", // FLEXIBLE, STANDARD, URGENT, EMERGENCY
  "desiredStartDate": "2024-02-01",
  "desiredEndDate": "2024-02-28",
  "images": ["url1", "url2"],
  "requiresLicense": true,
  "requiresInsurance": true
}
```

### Get All Jobs
```http
GET /api/v1/jobs?page=1&limit=10&category=Remodeling&minBudget=10000&maxBudget=50000&zipCode=30301&search=kitchen
```

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `limit` (int): Items per page (default: 10)
- `category` (string): Filter by category
- `status` (string): Filter by status
- `urgency` (string): Filter by urgency
- `minBudget` (number): Minimum budget
- `maxBudget` (number): Maximum budget
- `zipCode` (string): Filter by ZIP code
- `search` (string): Search in title/description
- `sortBy` (string): Sort field (default: createdAt)
- `sortOrder` (string): asc or desc (default: desc)

### Get Job Details
```http
GET /api/v1/jobs/{jobId}
```

### Get My Jobs (Customer only)
```http
GET /api/v1/jobs/my-jobs?page=1&limit=10&status=OPEN
Authorization: Bearer {token}
```

### Update Job
```http
PUT /api/v1/jobs/{jobId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description",
  "startingBid": 16000
}
```

### Delete Job
```http
DELETE /api/v1/jobs/{jobId}
Authorization: Bearer {token}
```

### Close Job
```http
POST /api/v1/jobs/{jobId}/close
Authorization: Bearer {token}
```

---

## 💰 Bids

### Submit Bid (Provider only)
```http
POST /api/v1/jobs/{jobId}/bids
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 18000,
  "proposal": "I have 10 years of experience...",
  "estimatedDuration": 30,
  "proposedStartDate": "2024-02-01",
  "laborCost": 8000,
  "materialCost": 9000,
  "equipmentCost": 1000,
  "attachments": ["url1", "url2"]
}
```

### Get Bids for Job (Customer only)
```http
GET /api/v1/jobs/{jobId}/bids
Authorization: Bearer {token}
```

### Get My Bids (Provider only)
```http
GET /api/v1/bids/my-bids?page=1&limit=10&status=PENDING
Authorization: Bearer {token}
```

### Get Bid Details
```http
GET /api/v1/bids/{bidId}
Authorization: Bearer {token}
```

### Update Bid
```http
PUT /api/v1/bids/{bidId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 17500,
  "proposal": "Updated proposal..."
}
```

### Withdraw Bid
```http
POST /api/v1/bids/{bidId}/withdraw
Authorization: Bearer {token}
```

### Accept Bid (Customer only)
```http
POST /api/v1/bids/{bidId}/accept
Authorization: Bearer {token}
```
*Note: This automatically creates a project!*

### Reject Bid (Customer only)
```http
POST /api/v1/bids/{bidId}/reject
Authorization: Bearer {token}
```

---

## 📋 Projects

### Get User's Projects
```http
GET /api/v1/projects?page=1&limit=10&status=IN_PROGRESS
Authorization: Bearer {token}
```

### Get Project Details
```http
GET /api/v1/projects/{projectId}
Authorization: Bearer {token}
```

### Create Milestone
```http
POST /api/v1/projects/{projectId}/milestones
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Foundation Work",
  "description": "Complete foundation and framing",
  "amount": 5000,
  "order": 1,
  "dueDate": "2024-02-15"
}
```

### Update Milestone
```http
PUT /api/v1/projects/milestones/{milestoneId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "IN_PROGRESS"
}
```

### Complete Milestone (Provider)
```http
POST /api/v1/projects/milestones/{milestoneId}/complete
Authorization: Bearer {token}
Content-Type: application/json

{
  "completionPhotos": ["url1", "url2"],
  "notes": "Milestone completed successfully"
}
```

### Approve Milestone (Customer)
```http
POST /api/v1/projects/milestones/{milestoneId}/approve
Authorization: Bearer {token}
```

### Reject Milestone (Customer)
```http
POST /api/v1/projects/milestones/{milestoneId}/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Work quality doesn't meet expectations"
}
```

### Update Project Status
```http
PUT /api/v1/projects/{projectId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "IN_PROGRESS" // PENDING_START, IN_PROGRESS, PENDING_APPROVAL, COMPLETED, CANCELLED
}
```

### Cancel Project
```http
POST /api/v1/projects/{projectId}/cancel
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Customer request"
}
```

---

## 💬 Messages

### Send Message
```http
POST /api/v1/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "receiverId": "user-id",
  "content": "Hello, I have a question about...",
  "projectId": "project-id", // optional
  "attachments": ["url1", "url2"] // optional
}
```

### Get Conversations
```http
GET /api/v1/messages/conversations
Authorization: Bearer {token}
```

### Get Messages with User
```http
GET /api/v1/messages/{userId}?page=1&limit=50&projectId=project-id
Authorization: Bearer {token}
```

### Get Project Messages
```http
GET /api/v1/messages/project/{projectId}
Authorization: Bearer {token}
```

### Get Unread Count
```http
GET /api/v1/messages/unread/count
Authorization: Bearer {token}
```

### Mark as Read
```http
PUT /api/v1/messages/{messageId}/read
Authorization: Bearer {token}
```

### Delete Message
```http
DELETE /api/v1/messages/{messageId}
Authorization: Bearer {token}
```
*Note: Can only delete within 5 minutes of sending*

---

## 💳 Payments

### Create Setup Intent
```http
POST /api/v1/payments/setup-intent
Authorization: Bearer {token}
```

### Fund Escrow
```http
POST /api/v1/payments/escrow
Authorization: Bearer {token}
Content-Type: application/json

{
  "projectId": "project-id",
  "paymentMethodId": "pm_xxx" // Stripe payment method ID
}
```

### Release Milestone Payment
```http
POST /api/v1/payments/release-milestone
Authorization: Bearer {token}
Content-Type: application/json

{
  "milestoneId": "milestone-id"
}
```

### Release Final Payment
```http
POST /api/v1/payments/release-final
Authorization: Bearer {token}
Content-Type: application/json

{
  "projectId": "project-id"
}
```

### Request Refund
```http
POST /api/v1/payments/refund
Authorization: Bearer {token}
Content-Type: application/json

{
  "paymentId": "payment-id",
  "reason": "Project cancelled"
}
```

### Get Payment History
```http
GET /api/v1/payments/history?page=1&limit=20&status=RELEASED&type=MILESTONE
Authorization: Bearer {token}
```

### Get Project Payments
```http
GET /api/v1/payments/project/{projectId}
Authorization: Bearer {token}
```

---

## ⭐ Reviews

### Create Review
```http
POST /api/v1/reviews
Authorization: Bearer {token}
Content-Type: application/json

{
  "projectId": "project-id",
  "overallRating": 4.5,
  "qualityRating": 5,
  "communicationRating": 4,
  "timelinessRating": 4.5,
  "budgetRating": 4,
  "title": "Great work!",
  "comment": "The provider did an excellent job...",
  "photos": ["url1", "url2"]
}
```

### Get User Reviews
```http
GET /api/v1/reviews/user/{userId}?page=1&limit=10&minRating=4
```

### Get My Reviews
```http
GET /api/v1/reviews/my-reviews
Authorization: Bearer {token}
```

### Update Review
```http
PUT /api/v1/reviews/{reviewId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "overallRating": 5,
  "comment": "Updated comment..."
}
```

### Respond to Review
```http
POST /api/v1/reviews/{reviewId}/respond
Authorization: Bearer {token}
Content-Type: application/json

{
  "response": "Thank you for the feedback!"
}
```

### Mark Review as Helpful
```http
POST /api/v1/reviews/{reviewId}/helpful
Authorization: Bearer {token}
```

---

## 📁 File Upload

### Upload Single File
```http
POST /api/v1/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [file data]
```

**Accepted file types:**
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, DOC, DOCX
- Max size: 10MB

### Upload Multiple Files
```http
POST /api/v1/upload/multiple
Authorization: Bearer {token}
Content-Type: multipart/form-data

files: [file1, file2, ...] // Max 10 files
```

### Get File Info
```http
GET /api/v1/upload/{filename}
Authorization: Bearer {token}
```

### Delete File
```http
DELETE /api/v1/upload/{filename}
Authorization: Bearer {token}
```

---

## 🛡️ Admin

### Get Platform Statistics
```http
GET /api/v1/admin/stats
Authorization: Bearer {admin-token}
```

### Get All Users
```http
GET /api/v1/admin/users?page=1&limit=20&role=PROVIDER&status=ACTIVE&search=john
Authorization: Bearer {admin-token}
```

### Suspend User
```http
POST /api/v1/admin/users/{userId}/suspend
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "reason": "Violation of terms of service"
}
```

### Reactivate User
```http
POST /api/v1/admin/users/{userId}/reactivate
Authorization: Bearer {admin-token}
```

### Get All Reports
```http
GET /api/v1/admin/reports?page=1&limit=20&status=PENDING&type=SPAM
Authorization: Bearer {admin-token}
```

### Resolve Report
```http
POST /api/v1/admin/reports/{reportId}/resolve
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "resolution": "User was warned and content removed",
  "action": "CONTENT_REMOVED"
}
```

### Dismiss Report
```http
POST /api/v1/admin/reports/{reportId}/dismiss
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "reason": "Not a valid violation"
}
```

---

## 📊 Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 500 | Internal Server Error |

---

## 🔒 Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    // Optional validation errors array
  ]
}
```

---

## 🧪 Testing with cURL

### Example: Complete workflow

```bash
# 1. Register customer
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "password": "Test123!",
    "firstName": "John",
    "lastName": "Customer",
    "role": "CUSTOMER"
  }'

# Save the token from response

# 2. Create a job
curl -X POST http://localhost:5000/api/v1/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Bathroom Remodel",
    "description": "Complete bathroom renovation",
    "category": "Remodeling",
    "address": "123 Main St",
    "city": "Atlanta",
    "state": "GA",
    "zipCode": "30301",
    "startingBid": 8000
  }'

# 3. Register provider
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "provider@test.com",
    "password": "Test123!",
    "firstName": "Jane",
    "lastName": "Provider",
    "role": "PROVIDER"
  }'

# 4. Submit a bid
curl -X POST http://localhost:5000/api/v1/jobs/JOB_ID/bids \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer PROVIDER_TOKEN" \
  -d '{
    "amount": 7500,
    "proposal": "I can complete this project in 2 weeks",
    "estimatedDuration": 14
  }'

# 5. Accept bid (as customer)
curl -X POST http://localhost:5000/api/v1/bids/BID_ID/accept \
  -H "Authorization: Bearer CUSTOMER_TOKEN"
```

---

## 📚 Additional Resources

- **Swagger UI:** http://localhost:5000/api-docs
- **Health Check:** http://localhost:5000/health
- **GitHub:** [Your repo URL]
- **Support:** support@bid4service.com

---

*Last updated: 2024*
