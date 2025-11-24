# Deploy Bid4Service to Railway

## Prerequisites
- GitHub account
- Railway account (sign up at railway.app)
- Your Bid4Service code

## Step 1: Prepare Your Code

1. **Create a Procfile** (tells Railway how to start your app)

Create `backend/Procfile`:
```
web: npm run start
```

2. **Update package.json scripts** (already done, but verify):
```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc",
    "postinstall": "prisma generate"
  }
}
```

3. **Create railway.json** in backend folder:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Step 2: Push to GitHub

```bash
# In your bid4service folder
git init
git add .
git commit -m "Initial commit - Ready for deployment"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/bid4service.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Railway

### A. Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub
3. Verify your account

### B. Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `bid4service` repository
4. Railway will detect it's a Node.js app

### C. Add PostgreSQL Database
1. In your project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will create and link the database automatically

### D. Configure Environment Variables
1. Click on your backend service
2. Go to "Variables" tab
3. Add these variables:

**Required Variables:**
```
NODE_ENV=production
PORT=5000
DATABASE_URL=${DATABASE_URL}  (auto-provided by Railway)
JWT_SECRET=your-super-secure-random-string-here-min-32-chars
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend-url.railway.app
```

**Optional but Recommended:**
```
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=noreply@yourdomain.com
```

### E. Generate Secure JWT Secret
Run this locally to generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output and use it as JWT_SECRET

### F. Configure Build
1. Click "Settings" tab
2. Under "Build Command", enter: `npm run build`
3. Under "Start Command", enter: `npm start`
4. Set "Root Directory" to `backend`

### G. Run Database Migrations
1. After first deployment, go to your service
2. Click "..." menu → "View Logs"
3. You'll need to run migrations. Two options:

**Option A: Using Railway CLI (Recommended)**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run npx prisma migrate deploy
```

**Option B: Using Railway Web Shell**
1. In Railway dashboard, click your service
2. Click "..." → "Shell"
3. Run: `npx prisma migrate deploy`

### H. Get Your API URL
1. Go to "Settings" tab
2. Under "Networking", you'll see "Public Networking"
3. Click "Generate Domain"
4. Your API is now live at: `https://your-app-name.railway.app`

## Step 4: Test Your Deployment

```bash
# Test health endpoint
curl https://your-app-name.railway.app/health

# Test user registration
curl -X POST https://your-app-name.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER"
  }'
```

## Step 5: Set Up Custom Domain (Optional)

1. Go to "Settings" → "Networking"
2. Click "Add a Custom Domain"
3. Enter your domain (e.g., api.bid4service.com)
4. Add the CNAME record to your DNS provider:
   - Type: CNAME
   - Name: api (or whatever subdomain)
   - Value: your-app.railway.app

Railway provides free SSL automatically!

## Monitoring & Logs

**View Logs:**
1. Click your service
2. Click "Deployments" tab
3. Click latest deployment
4. View real-time logs

**Set Up Alerts:**
1. Go to project settings
2. Set up webhooks for deployment notifications
3. Connect to Slack or Discord

## Troubleshooting

### Problem: Build Fails
**Solution:** Check build logs. Common issues:
- Missing `npm run build` script
- TypeScript errors
- Missing dependencies

### Problem: Database Connection Error
**Solution:**
- Verify DATABASE_URL is set
- Run migrations: `railway run npx prisma migrate deploy`
- Check database is running in Railway dashboard

### Problem: 500 Errors
**Solution:**
- Check logs for errors
- Verify all environment variables are set
- Ensure JWT_SECRET is set
- Check database is connected

### Problem: Can't Access API
**Solution:**
- Verify domain is generated
- Check service is running (not crashed)
- Look at deployment logs

## Automatic Deployments

Railway automatically deploys when you push to GitHub:
```bash
# Make changes
git add .
git commit -m "Update feature"
git push

# Railway automatically deploys!
```

## Scaling

**Vertical Scaling (More Power):**
1. Go to Settings → Resources
2. Adjust memory and CPU

**Horizontal Scaling (More Instances):**
- Available on paid plans
- Adjust in railway.json `numReplicas`

## Costs

**Free Tier:**
- $5 credit per month
- Good for development/testing

**Paid Plans:**
- ~$5-10/month for small apps
- ~$20-50/month for production
- Pay only for what you use

## Backup & Safety

**Database Backups:**
1. Railway automatically backs up PostgreSQL
2. Manual backup:
   ```bash
   railway run pg_dump $DATABASE_URL > backup.sql
   ```

**Rollback Deployment:**
1. Go to "Deployments" tab
2. Click previous successful deployment
3. Click "Redeploy"

---

## 🎉 Your API is Now Live!

API URL: `https://your-app-name.railway.app`
API Docs: `https://your-app-name.railway.app/api-docs`

Test it:
```bash
curl https://your-app-name.railway.app/health
```

---

## Next Steps

1. ✅ Update FRONTEND_URL in Railway to your actual frontend URL
2. ✅ Set up custom domain
3. ✅ Add monitoring (Railway provides basic monitoring)
4. ✅ Set up error tracking (Sentry recommended)
5. ✅ Configure backups
6. ✅ Add Stripe keys for payments
7. ✅ Add SendGrid for emails

---

**Need help?** Railway has excellent docs: https://docs.railway.app
