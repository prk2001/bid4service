# 🚀 QUICK DEPLOYMENT REFERENCE

## Railway Deployment - 10 Minute Checklist

### 1️⃣ Prepare Code (2 min)
```bash
cd bid4service
git init
git add .
git commit -m "Initial commit"
```

### 2️⃣ Push to GitHub (3 min)
1. Create repo on github.com
2. Push code:
```bash
git remote add origin https://github.com/USERNAME/bid4service.git
git push -u origin main
```

### 3️⃣ Railway Setup (2 min)
1. Go to railway.app
2. Login with GitHub
3. New Project → Deploy from GitHub
4. Select bid4service repo

### 4️⃣ Add Database (1 min)
1. Click "New" in project
2. Select "Database" → "PostgreSQL"
3. Done! Auto-linked

### 5️⃣ Environment Variables (2 min)
Click service → Variables → Add:
- `NODE_ENV` = `production`
- `PORT` = `5000`
- `JWT_SECRET` = (generate with command below)
- `JWT_EXPIRES_IN` = `7d`

Generate JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 6️⃣ Run Migrations (2 min)
Service → "⋯" → "Run a Command":
```bash
npx prisma migrate deploy
```

### 7️⃣ Generate URL (1 min)
Service → Settings → Networking → "Generate Domain"

### 8️⃣ Test (1 min)
```bash
curl https://your-app.railway.app/health
```

---

## 🎯 Success Criteria

✅ Health endpoint returns 200  
✅ API docs load  
✅ Can register a test user  
✅ Database connected  
✅ No errors in Railway logs

---

## 🔧 Quick Commands

**View logs:**
```bash
# In Railway dashboard: Service → Deployments → Latest
```

**Restart service:**
```bash
# In Railway: Service → "⋯" → Restart
```

**Update app:**
```bash
git add .
git commit -m "Update"
git push
# Railway auto-deploys!
```

**Run database command:**
```bash
# Railway: Service → "⋯" → Run a Command
npx prisma studio  # View database
npx prisma migrate deploy  # Run migrations
```

---

## ⚡ Test Your API

**Register user:**
```bash
curl -X POST https://YOUR-APP.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"John","lastName":"Doe","role":"CUSTOMER"}'
```

**Login:**
```bash
curl -X POST https://YOUR-APP.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

**Create job (use token from login):**
```bash
curl -X POST https://YOUR-APP.railway.app/api/v1/jobs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Job","description":"Test","category":"Plumbing","address":"123 Main","city":"Atlanta","state":"GA","zipCode":"30301","startingBid":1000}'
```

---

## 🆘 Common Issues

| Problem | Solution |
|---------|----------|
| Build fails | Check package.json has all dependencies |
| 500 errors | Check logs, verify JWT_SECRET is set |
| Database error | Run `npx prisma migrate deploy` |
| Can't connect | Check DATABASE_URL exists (auto-set) |

---

## 📊 Your URLs

After deployment, save these:

- **API Base:** `https://[your-app].railway.app`
- **API Docs:** `https://[your-app].railway.app/api-docs`
- **Health:** `https://[your-app].railway.app/health`
- **Railway Dashboard:** `https://railway.app/project/[your-project-id]`

---

## 💰 Cost Tracking

- **Free Tier:** $5 credit/month
- **Your Usage:** ~$0-5/month for MVP
- **View Usage:** Railway Dashboard → Project → Usage

---

## 🎉 Next Steps After Deployment

1. ✅ Test all endpoints
2. ✅ Set up Stripe (optional)
3. ✅ Add custom domain (optional)
4. ✅ Build frontend
5. ✅ Share with users!

---

**Full Guide:** See DEPLOYMENT_WALKTHROUGH.md  
**Troubleshooting:** See DEPLOY_RAILWAY.md
