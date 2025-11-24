# Deploy Bid4Service to Heroku

## Prerequisites
- Heroku account (heroku.com)
- Heroku CLI installed
- Git repository

## Step 1: Install Heroku CLI

**macOS:**
```bash
brew tap heroku/brew && brew install heroku
```

**Windows:**
Download from: https://devcenter.heroku.com/articles/heroku-cli

**Linux:**
```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

## Step 2: Prepare Your Code

1. **Create Procfile** in backend folder:
```
web: npm run start
release: npx prisma migrate deploy
```

2. **Update package.json** (should already have):
```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc",
    "postinstall": "prisma generate"
  },
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
```

3. **Create .slugignore** (tells Heroku what to ignore):
```
*.md
tests/
coverage/
.git
.env.example
```

## Step 3: Login to Heroku

```bash
heroku login
```

This opens a browser for authentication.

## Step 4: Create Heroku App

```bash
# Navigate to your backend folder
cd bid4service/backend

# Create app
heroku create your-app-name

# Or let Heroku generate a name
heroku create
```

Your app will be at: `https://your-app-name.herokuapp.com`

## Step 5: Add PostgreSQL Database

```bash
# Add Heroku Postgres (free tier)
heroku addons:create heroku-postgresql:mini

# This automatically sets DATABASE_URL
```

## Step 6: Configure Environment Variables

```bash
# Set JWT secret
heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Set other variables
heroku config:set NODE_ENV=production
heroku config:set JWT_EXPIRES_IN=7d
heroku config:set PORT=5000

# Optional: Set Stripe keys
heroku config:set STRIPE_SECRET_KEY=sk_live_your_key
heroku config:set STRIPE_PUBLISHABLE_KEY=pk_live_your_key

# Optional: Set SendGrid
heroku config:set SENDGRID_API_KEY=your_key
heroku config:set FROM_EMAIL=noreply@yourdomain.com

# Set frontend URL (update after frontend is deployed)
heroku config:set FRONTEND_URL=https://your-frontend.herokuapp.com
```

View all config:
```bash
heroku config
```

## Step 7: Deploy

```bash
# If you haven't initialized git
git init
git add .
git commit -m "Ready for Heroku deployment"

# Add Heroku remote (if not done automatically)
heroku git:remote -a your-app-name

# Deploy!
git push heroku main

# Or if your branch is named master:
git push heroku master
```

Heroku will:
1. Detect Node.js
2. Install dependencies
3. Run `npm run build`
4. Run Prisma migrations (from Procfile)
5. Start the app

## Step 8: Scale & Start

```bash
# Ensure at least one web dyno is running
heroku ps:scale web=1

# Check status
heroku ps

# View logs
heroku logs --tail
```

## Step 9: Run Database Migrations (if needed)

```bash
# Run migrations manually (usually done automatically)
heroku run npx prisma migrate deploy

# Or access database directly
heroku pg:psql
```

## Step 10: Test Deployment

```bash
# Test health endpoint
curl https://your-app-name.herokuapp.com/health

# View app in browser
heroku open

# View API docs
open https://your-app-name.herokuapp.com/api-docs
```

## Set Up Custom Domain (Optional)

```bash
# Add custom domain
heroku domains:add api.yourdomain.com

# Heroku will provide a DNS target
# Add CNAME record in your DNS provider:
# Name: api
# Value: your-app-name.herokudns.com

# Enable automatic SSL
heroku certs:auto:enable
```

## Monitoring & Maintenance

**View Logs:**
```bash
# Real-time logs
heroku logs --tail

# Last 100 lines
heroku logs -n 100

# Filter by source
heroku logs --source app
```

**Restart App:**
```bash
heroku restart
```

**Run Commands:**
```bash
# Run any command in Heroku environment
heroku run bash
heroku run npx prisma studio
```

**Database Management:**
```bash
# View database info
heroku pg:info

# Create backup
heroku pg:backups:capture

# Download backup
heroku pg:backups:download

# Restore from backup
heroku pg:backups:restore
```

## Automatic Deployments from GitHub

1. Go to Heroku Dashboard
2. Select your app
3. Go to "Deploy" tab
4. Connect to GitHub
5. Select repository
6. Enable "Automatic Deploys" from main branch

Now every push to GitHub automatically deploys!

## Add-ons (Optional but Recommended)

**Monitoring:**
```bash
# New Relic (free tier)
heroku addons:create newrelic:wayne
```

**Logging:**
```bash
# Papertrail (free tier)
heroku addons:create papertrail:choklad
```

**Redis (for future caching):**
```bash
# Redis (free tier)
heroku addons:create heroku-redis:mini
```

**Scheduler (for cron jobs):**
```bash
heroku addons:create scheduler:standard
```

## Scaling

**Vertical (Dyno Size):**
```bash
# Upgrade to Hobby dyno ($7/month)
heroku ps:scale web=1:hobby

# Upgrade to Standard ($25/month)
heroku ps:scale web=1:standard-1x
```

**Horizontal (More Dynos):**
```bash
# Scale to 2 dynos
heroku ps:scale web=2
```

## Costs

**Free Tier:**
- 550-1000 free dyno hours/month
- Free PostgreSQL (10k rows, 20 connections)
- App sleeps after 30 min inactivity

**Hobby Plan ($7/month per dyno):**
- Never sleeps
- Custom domains
- SSL included
- More dyno hours

**Standard Plan ($25-50/month):**
- Better performance
- Metrics
- Horizontal scaling

## Troubleshooting

**Problem: Application Error (H10)**
```bash
# Check logs
heroku logs --tail

# Ensure web dyno is running
heroku ps:scale web=1

# Restart
heroku restart
```

**Problem: Database Connection Error**
```bash
# Check DATABASE_URL is set
heroku config:get DATABASE_URL

# Run migrations
heroku run npx prisma migrate deploy
```

**Problem: Build Failed**
```bash
# Check build logs
heroku logs --tail

# Ensure package.json is correct
# Ensure Procfile exists
```

**Problem: Timeout Errors**
```bash
# Heroku has 30-second request timeout
# Make sure your endpoints respond quickly
# Use background jobs for long tasks
```

## Environment-Specific Setup

**Staging Environment:**
```bash
# Create staging app
heroku create your-app-staging --remote staging

# Deploy to staging
git push staging main

# Run commands on staging
heroku run --app your-app-staging npx prisma migrate deploy
```

## Backup Strategy

**Automatic Backups:**
```bash
# Schedule daily backups (requires paid plan)
heroku pg:backups:schedule --at '02:00 America/New_York'

# Manual backup
heroku pg:backups:capture
```

**Download & Store Locally:**
```bash
heroku pg:backups:download
# Saves to latest.dump
```

## CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Heroku
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "your-app-name"
          heroku_email: "your-email@example.com"
```

---

## 🎉 Your API is Live on Heroku!

**URLs:**
- API: `https://your-app-name.herokuapp.com`
- API Docs: `https://your-app-name.herokuapp.com/api-docs`
- Database: Managed by Heroku Postgres

**Quick Reference:**
```bash
# Deploy changes
git push heroku main

# View logs
heroku logs --tail

# Run migrations
heroku run npx prisma migrate deploy

# Restart app
heroku restart

# Open in browser
heroku open
```

---

## Useful Heroku Commands Cheat Sheet

```bash
# App info
heroku info

# Environment variables
heroku config
heroku config:set KEY=value
heroku config:unset KEY

# Database
heroku pg:info
heroku pg:psql
heroku pg:backups

# Logs
heroku logs --tail --source app
heroku logs --ps web.1

# Scaling
heroku ps
heroku ps:scale web=1
heroku ps:restart

# Maintenance mode
heroku maintenance:on
heroku maintenance:off

# Release management
heroku releases
heroku rollback
```

---

**Resources:**
- Heroku Dev Center: https://devcenter.heroku.com/
- Node.js on Heroku: https://devcenter.heroku.com/articles/deploying-nodejs
- Heroku Postgres: https://devcenter.heroku.com/articles/heroku-postgresql
