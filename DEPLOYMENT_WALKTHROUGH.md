# 🚀 DEPLOY TO RAILWAY - STEP-BY-STEP GUIDE

Follow these steps **exactly** and your API will be live in 10 minutes!

---

## ✅ STEP 1: PREPARE YOUR CODE (2 minutes)

### 1.1 Open Terminal and Navigate to Your Project
```bash
cd path/to/bid4service
```

### 1.2 Initialize Git (if not already done)
```bash
git init
```

### 1.3 Create .gitignore File
This tells Git what NOT to upload:

```bash
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Environment
.env
.env.local
.env*.local

# Build
dist/
build/
*.tsbuildinfo

# Logs
logs/
*.log

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Uploads
uploads/

# Testing
coverage/
EOF
```

### 1.4 Add All Files to Git
```bash
git add .
git commit -m "Initial commit - Bid4Service MVP"
```

**✓ Checkpoint:** Run `git status` - you should see "nothing to commit, working tree clean"

---

## ✅ STEP 2: CREATE GITHUB REPOSITORY (3 minutes)

### 2.1 Go to GitHub
Open your browser and go to: https://github.com

### 2.2 Create New Repository
1. Click the **"+"** in top right
2. Click **"New repository"**
3. Name it: **"bid4service"** (or whatever you want)
4. Keep it **Private** (recommended) or Public
5. **DO NOT** initialize with README, .gitignore, or license
6. Click **"Create repository"**

### 2.3 Push Your Code to GitHub
GitHub will show you commands. Use these:

```bash
git remote add origin https://github.com/YOUR_USERNAME/bid4service.git
git branch -M main
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username!**

**✓ Checkpoint:** Refresh GitHub page - you should see all your files

---

## ✅ STEP 3: SIGN UP FOR RAILWAY (2 minutes)

### 3.1 Go to Railway
Open: https://railway.app

### 3.2 Sign Up
1. Click **"Login"** (top right)
2. Click **"Sign in with GitHub"**
3. Authorize Railway to access your GitHub
4. **No credit card required!**

**✓ Checkpoint:** You should see Railway dashboard

---

## ✅ STEP 4: CREATE NEW PROJECT (1 minute)

### 4.1 Create Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your **"bid4service"** repository
4. Click **"Deploy Now"**

Railway will start building your project automatically!

**✓ Checkpoint:** You should see build logs running

---

## ✅ STEP 5: ADD POSTGRESQL DATABASE (1 minute)

### 5.1 Add Database
1. In your project, click **"New"** button
2. Select **"Database"**
3. Choose **"PostgreSQL"**
4. Railway creates and links database automatically!

**✓ Checkpoint:** You should see PostgreSQL tile in your project

---

## ✅ STEP 6: CONFIGURE ENVIRONMENT VARIABLES (3 minutes)

### 6.1 Click on Your Service (backend)
Click the tile that says "bid4service" or your repo name

### 6.2 Go to Variables Tab
Click **"Variables"** in the left sidebar

### 6.3 Add These Variables

Click **"New Variable"** and add each of these:

**Required Variables:**

| Name | Value | Notes |
|------|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `5000` | |
| `JWT_SECRET` | Generate one! See below ⬇️ | |
| `JWT_EXPIRES_IN` | `7d` | |
| `FRONTEND_URL` | `https://your-app.railway.app` | Will update later |

**JWT_SECRET Generation:**
Open a new terminal and run:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output and paste as JWT_SECRET value.

**Optional (but recommended for full functionality):**

| Name | Value | Where to Get It |
|------|-------|-----------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | https://dashboard.stripe.com/test/apikeys |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | https://dashboard.stripe.com/test/apikeys |
| `SENDGRID_API_KEY` | Your API key | https://app.sendgrid.com/settings/api_keys |
| `FROM_EMAIL` | `noreply@yourdomain.com` | Your email |

**✓ Checkpoint:** All required variables are set

---

## ✅ STEP 7: RUN DATABASE MIGRATIONS (2 minutes)

### 7.1 Wait for First Deploy
Wait until Railway shows "Success" (usually 2-3 minutes)

### 7.2 Open Service Settings
1. Click your service (backend)
2. Click the **"⋯"** menu (three dots)
3. Click **"Run a Command"**

### 7.3 Run Migration
In the command box, type:
```bash
npx prisma migrate deploy
```
Click **"Run"**

Wait for it to complete (should say "✓ Done")

**✓ Checkpoint:** Migrations completed successfully

---

## ✅ STEP 8: GENERATE PUBLIC URL (1 minute)

### 8.1 Open Settings
1. Click your service (backend)
2. Click **"Settings"** tab

### 8.2 Generate Domain
1. Scroll to **"Networking"** section
2. Click **"Generate Domain"**

You'll get a URL like: `https://bid4service-production-xxxx.railway.app`

**✓ Checkpoint:** You have a public URL

---

## ✅ STEP 9: TEST YOUR API (2 minutes)

### 9.1 Test Health Endpoint
Open your browser or use curl:

```bash
curl https://your-app-name.railway.app/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-23T...",
  "uptime": 123.456,
  "environment": "production"
}
```

### 9.2 Test API Documentation
Open in browser:
```
https://your-app-name.railway.app/api-docs
```

You should see Swagger UI with all your endpoints!

### 9.3 Test User Registration
```bash
curl -X POST https://your-app-name.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {...},
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**✓ Checkpoint:** All tests pass!

---

## 🎉 CONGRATULATIONS! YOUR API IS LIVE!

### Your API URLs:
- **Base URL:** `https://your-app-name.railway.app`
- **API Documentation:** `https://your-app-name.railway.app/api-docs`
- **Health Check:** `https://your-app-name.railway.app/health`

### What You Can Do Now:

✅ **Test All Endpoints** - Use Postman or curl  
✅ **Share with Others** - Give them the API URL  
✅ **Build Frontend** - Connect it to this API  
✅ **Monitor** - Check Railway dashboard for logs

---

## 📊 RAILWAY DASHBOARD FEATURES

### View Logs
1. Click your service
2. Click **"Deployments"** tab
3. Click latest deployment
4. See real-time logs!

### View Metrics
1. Click your service
2. See CPU, memory, network usage

### Restart Service
1. Click your service
2. Click **"⋯"** → **"Restart"**

---

## 🔧 TROUBLESHOOTING

### Problem: Build Failed
**Solution:**
1. Check build logs in Railway
2. Make sure all dependencies are in package.json
3. Verify TypeScript compiles: `npm run build`

### Problem: Database Connection Error
**Solution:**
1. Check DATABASE_URL is set (Railway does this automatically)
2. Make sure migrations ran: `npx prisma migrate deploy`
3. Check PostgreSQL service is running

### Problem: "Cannot find module"
**Solution:**
1. Add missing dependency to package.json
2. Push to GitHub
3. Railway will auto-deploy

### Problem: API Returns 500 Error
**Solution:**
1. Check logs in Railway
2. Verify all environment variables are set
3. Make sure JWT_SECRET is set

---

## 📝 UPDATING YOUR APP

When you make changes:

```bash
# Make your changes
git add .
git commit -m "Description of changes"
git push

# Railway automatically deploys!
```

Watch deployment in Railway dashboard.

---

## 💰 COST ESTIMATE

**Current Usage:**
- Free tier: $5 credit/month
- Your app: ~$0-5/month

**If You Exceed Free Tier:**
- Small app: $5-10/month
- Medium app: $10-20/month
- Production: $20-50/month

Railway only charges for what you use!

---

## 🎯 NEXT STEPS

### Option 1: Add Custom Domain
1. Go to Service → Settings → Networking
2. Click "Add Custom Domain"
3. Enter your domain (e.g., api.yourdomain.com)
4. Add CNAME record to your DNS

### Option 2: Set Up Stripe
1. Go to https://dashboard.stripe.com
2. Get your API keys
3. Add to Railway environment variables
4. Restart service

### Option 3: Add Email (SendGrid)
1. Sign up at https://sendgrid.com
2. Create API key
3. Add to Railway environment variables
4. Restart service

### Option 4: Monitor & Scale
1. Set up monitoring
2. Add more environment variables as needed
3. Scale resources if needed

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] Git repository created
- [ ] Code pushed to GitHub
- [ ] Railway account created
- [ ] Project created on Railway
- [ ] PostgreSQL database added
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Public URL generated
- [ ] Health check passes
- [ ] API documentation accessible
- [ ] Test user registration works

**All checked?** → **YOUR API IS LIVE!** 🎉

---

## 🆘 NEED HELP?

If you get stuck at any step:

1. **Check Railway Logs:**
   - Go to your service
   - Click "Deployments"
   - Look for error messages

2. **Common Issues:**
   - Build errors → Check package.json
   - Runtime errors → Check environment variables
   - Database errors → Run migrations again

3. **Ask Me:**
   - Tell me what step you're on
   - Share any error messages
   - I'll help you fix it!

---

## 📸 WHAT SUCCESS LOOKS LIKE

**Railway Dashboard:**
- ✅ Green "Active" status
- ✅ "Last deployed X minutes ago"
- ✅ Logs showing "Server running on port 5000"

**Browser Test:**
- ✅ Health check returns JSON
- ✅ API docs page loads
- ✅ Can register a test user

---

**YOU'VE GOT THIS!** 🚀

Start with **STEP 1** above and follow each step carefully.

I'm here if you need help at any point!
