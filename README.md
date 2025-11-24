# Bid4Service MVP - Home Services Bidding Platform

A reverse bidding platform connecting homeowners with service providers for home improvement, repairs, and maintenance projects.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ LTS
- PostgreSQL 14+
- npm or yarn
- Stripe account (for payments)
- AWS account (for file uploads) - optional for local development

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd bid4service
```

2. **Install dependencies**
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. **Database setup**
```bash
cd backend

# Create PostgreSQL database
createdb bid4service_dev

# Copy environment variables
cp .env.example .env

# Edit .env with your database credentials and API keys

# Run database migrations
npx prisma migrate dev

# Seed database with sample data (optional)
npm run seed
```

4. **Start development servers**
```bash
# Terminal 1 - Backend (runs on http://localhost:5000)
cd backend
npm run dev

# Terminal 2 - Frontend (runs on http://localhost:3000)
cd frontend
npm start
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs

## 📁 Project Structure

```
bid4service/
├── backend/                 # Node.js + Express + TypeScript backend
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Database models (Prisma)
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── server.ts       # Express app entry point
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── tests/              # Backend tests
│   └── package.json
├── frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service calls
│   │   ├── store/          # Redux store
│   │   ├── utils/          # Utility functions
│   │   └── App.tsx         # Main app component
│   ├── public/             # Static assets
│   └── package.json
└── README.md               # This file
```

## 🔑 Environment Variables

### Backend (.env)
```
# Server
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/bid4service_dev"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# AWS S3 (optional for local dev)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=bid4service-uploads

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@bid4service.com

# SMS (Twilio) - optional
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## 📚 API Documentation

API documentation is available at http://localhost:5000/api-docs when running the development server.

### Main Endpoints

**Authentication**
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user

**Users**
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update profile
- `POST /api/v1/users/verify` - Submit verification documents

**Jobs**
- `GET /api/v1/jobs` - List all jobs
- `POST /api/v1/jobs` - Create new job
- `GET /api/v1/jobs/:id` - Get job details
- `PUT /api/v1/jobs/:id` - Update job
- `DELETE /api/v1/jobs/:id` - Delete job

**Bids**
- `GET /api/v1/jobs/:jobId/bids` - Get bids for a job
- `POST /api/v1/jobs/:jobId/bids` - Submit a bid
- `PUT /api/v1/bids/:id` - Update bid
- `POST /api/v1/bids/:id/accept` - Accept bid

**Messages**
- `GET /api/v1/messages` - Get all conversations
- `GET /api/v1/messages/:userId` - Get messages with user
- `POST /api/v1/messages` - Send message

**Payments**
- `POST /api/v1/payments/setup-intent` - Create payment setup
- `POST /api/v1/payments/escrow` - Fund escrow
- `POST /api/v1/payments/release` - Release escrow funds

**Reviews**
- `GET /api/v1/users/:userId/reviews` - Get user reviews
- `POST /api/v1/projects/:projectId/reviews` - Create review

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## 🚀 Deployment

### Production Build

```bash
# Build frontend
cd frontend
npm run build

# Build backend
cd backend
npm run build
```

### Deploy to Production
See DEPLOYMENT.md for detailed production deployment instructions.

## 📝 Development Workflow

1. Create feature branch from `main`
2. Make changes
3. Write tests
4. Run tests locally
5. Commit with descriptive message
6. Push and create pull request
7. Code review
8. Merge to main
9. Auto-deploy to staging
10. Manual deploy to production

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

This project is proprietary and confidential.

## 🆘 Support

For support, email support@bid4service.com or open an issue.

## 🗺️ Roadmap

See the [Complete Architecture Document](./docs/Bid4Service_Complete_Architecture.md) for full platform roadmap.

### MVP Features (Current Phase)
- ✅ User authentication
- ✅ User profiles
- ✅ Job posting
- ✅ Bidding system
- ✅ Messaging
- ✅ Payment integration
- ✅ Reviews

### Phase 2 (Next 3-4 months)
- Advanced verification
- Dispute resolution
- Mobile apps
- Video calls
- Analytics dashboard

### Phase 3+ (6-12 months)
- AI matching
- Multi-language support
- Government portal
- Advanced features

---

**Built with ❤️ for the home services industry**
