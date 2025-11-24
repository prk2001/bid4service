# 🚀 Getting Started with Bid4Service MVP

This guide will walk you through setting up and running the Bid4Service platform locally.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ (Download from https://nodejs.org/)
- **PostgreSQL** 14+ (Download from https://www.postgresql.org/download/)
- **Git** (Download from https://git-scm.com/)
- **Code Editor** (VS Code recommended: https://code.visualstudio.com/)

## Step-by-Step Setup

### 1. Download the Project

Download and extract the `bid4service` folder to your desired location.

### 2. Install PostgreSQL and Create Database

```bash
# On macOS (using Homebrew)
brew install postgresql
brew services start postgresql

# On Windows, use the installer from postgresql.org

# Create database
psql postgres
CREATE DATABASE bid4service_dev;
\q
```

### 3. Backend Setup

```bash
# Navigate to backend directory
cd bid4service/backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env file with your settings
# IMPORTANT: Update these values:
# - DATABASE_URL with your PostgreSQL credentials
# - JWT_SECRET with a secure random string
# - STRIPE keys (get from https://dashboard.stripe.com)

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Seed database with sample data
npm run seed
```

### 4. Start Backend Server

```bash
# In the backend directory
npm run dev

# You should see:
# 🚀 Server running in development mode on port 5000
# 📚 API Documentation available at http://localhost:5000/api-docs
```

### 5. Test the API

Open your browser and visit:
- Health check: http://localhost:5000/health
- API docs: http://localhost:5000/api-docs

Or use curl:
```bash
# Test health endpoint
curl http://localhost:5000/health

# Register a new user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER"
  }'
```

## What's Been Built (MVP Phase 1)

✅ **Complete Backend Infrastructure:**
- Express.js server with TypeScript
- PostgreSQL database with Prisma ORM
- JWT authentication system
- User registration & login
- Error handling & logging
- API documentation (Swagger)
- Security middleware (Helmet, CORS, Rate Limiting)

✅ **Database Schema:**
- Users (customers & providers)
- Customer profiles
- Provider profiles
- Jobs
- Bids
- Projects
- Milestones
- Payments
- Messages
- Reviews
- Notifications
- Reports

✅ **Authentication System:**
- User registration (customers & providers)
- User login with JWT
- Password hashing with bcrypt
- Get current user
- Change password
- Logout

## Database Schema Overview

Run this to see your database schema visually:
```bash
cd backend
npx prisma studio
```

This will open a browser with a visual interface to your database at http://localhost:5555

## API Endpoints Available

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user (requires auth)
- `POST /api/v1/auth/logout` - Logout
- `PUT /api/v1/auth/change-password` - Change password

### Coming Next
- Job management (create, list, update, delete)
- Bidding system
- Messaging
- Payments
- Reviews

## Testing with Postman

1. Download Postman: https://www.postman.com/downloads/
2. Create a new request
3. Register a user:
   - Method: POST
   - URL: `http://localhost:5000/api/v1/auth/register`
   - Body (JSON):
   ```json
   {
     "email": "customer@test.com",
     "password": "TestPass123!",
     "firstName": "Jane",
     "lastName": "Customer",
     "role": "CUSTOMER",
     "phone": "5551234567"
   }
   ```
4. Copy the token from the response
5. Test authenticated endpoint:
   - Method: GET
   - URL: `http://localhost:5000/api/v1/auth/me`
   - Headers: `Authorization: Bearer YOUR_TOKEN_HERE`

## Common Issues & Solutions

### Issue: "Cannot find module '@prisma/client'"
**Solution:**
```bash
cd backend
npx prisma generate
```

### Issue: "Error: P1001: Can't reach database server"
**Solution:** 
- Make sure PostgreSQL is running
- Check your DATABASE_URL in .env file
- Verify database credentials

### Issue: "Port 5000 already in use"
**Solution:**
```bash
# Find and kill the process using port 5000
# macOS/Linux:
lsof -ti:5000 | xargs kill -9

# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Issue: JWT errors
**Solution:**
- Make sure JWT_SECRET is set in your .env file
- Make sure you're sending the token in the Authorization header
- Check that the token hasn't expired (default: 7 days)

## Next Steps

### Option A: Continue Building Backend Features
I can add:
1. **Job Management** - Create, list, edit jobs
2. **Bidding System** - Submit and manage bids
3. **Messaging** - Real-time chat between users
4. **Payment Integration** - Stripe escrow system
5. **Review System** - Ratings and reviews

### Option B: Build the Frontend
I can create:
1. React app with TypeScript
2. User registration & login UI
3. Dashboard for customers and providers
4. Job posting interface
5. Bidding interface
6. Material-UI components

### Option C: Deploy to Cloud
I can help you:
1. Deploy backend to AWS/Heroku/DigitalOcean
2. Set up production database
3. Configure CI/CD pipeline
4. Set up domain and SSL

## Development Tips

1. **Use Prisma Studio** for database visualization:
   ```bash
   npx prisma studio
   ```

2. **Check logs** in the `logs/` folder

3. **Use API documentation** at http://localhost:5000/api-docs

4. **Hot reload** is enabled - code changes restart the server automatically

5. **Database changes:**
   ```bash
   # After modifying schema.prisma
   npx prisma migrate dev --name description_of_changes
   npx prisma generate
   ```

## Project Structure

```
bid4service/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   │   └── auth.controller.ts ✅
│   │   ├── middleware/      # Custom middleware
│   │   │   ├── auth.ts ✅
│   │   │   ├── errorHandler.ts ✅
│   │   │   └── notFound.ts ✅
│   │   ├── routes/          # API routes
│   │   │   ├── auth.routes.ts ✅
│   │   │   ├── user.routes.ts ⏳
│   │   │   ├── job.routes.ts ⏳
│   │   │   ├── bid.routes.ts ⏳
│   │   │   ├── project.routes.ts ⏳
│   │   │   ├── message.routes.ts ⏳
│   │   │   ├── payment.routes.ts ⏳
│   │   │   └── review.routes.ts ⏳
│   │   ├── utils/           # Utility functions
│   │   │   ├── logger.ts ✅
│   │   │   ├── jwt.ts ✅
│   │   │   └── errors.ts ✅
│   │   └── server.ts ✅     # Main server file
│   ├── prisma/
│   │   └── schema.prisma ✅  # Database schema
│   ├── .env.example ✅
│   ├── package.json ✅
│   └── tsconfig.json ✅
└── README.md ✅

✅ = Complete
⏳ = Placeholder (to be implemented)
```

## Getting Help

If you run into issues:
1. Check the logs in `backend/logs/`
2. Review the error message carefully
3. Check the API documentation
4. Ask me for help - I can debug and add features!

## What's Next?

Tell me what you'd like to do:
1. **"Add job management"** - Build CRUD for jobs
2. **"Add bidding system"** - Complete bidding functionality
3. **"Build the frontend"** - Create React UI
4. **"Add more features"** - Payment, messaging, reviews
5. **"Help me deploy"** - Get it live on the internet

---

**You now have a working backend with authentication!** 🎉

The server is running, the database is set up, and users can register and login.

Ready to build more features? Just let me know what's next!
