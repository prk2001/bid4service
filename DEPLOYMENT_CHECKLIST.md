# ✅ DEPLOYMENT CHECKLIST

Print this out or keep it open while deploying!

---

## PRE-DEPLOYMENT

- [ ] Downloaded bid4service folder
- [ ] Have GitHub account
- [ ] Have Railway account  
- [ ] Have 10 minutes free
- [ ] Terminal/command line open

---

## PART 1: GIT & GITHUB (5 min)

- [ ] Opened terminal
- [ ] Navigated to bid4service folder: `cd bid4service`
- [ ] Ran `git init`
- [ ] Ran `git add .`
- [ ] Ran `git commit -m "Initial commit"`
- [ ] Created GitHub repository at github.com/new
- [ ] Copied and ran GitHub push commands
- [ ] Refreshed GitHub - see all files

---

## PART 2: RAILWAY SETUP (5 min)

- [ ] Went to railway.app
- [ ] Signed in with GitHub
- [ ] Clicked "New Project"
- [ ] Selected "Deploy from GitHub repo"
- [ ] Chose "bid4service" repository
- [ ] Waited for build to complete (2-3 min)
- [ ] Clicked "New" → "Database" → "PostgreSQL"
- [ ] Database created successfully

---

## PART 3: CONFIGURATION (3 min)

- [ ] Clicked on backend service
- [ ] Clicked "Variables" tab
- [ ] Added `NODE_ENV` = `production`
- [ ] Added `PORT` = `5000`
- [ ] Generated JWT_SECRET (ran command)
- [ ] Added `JWT_SECRET` = (the generated value)
- [ ] Added `JWT_EXPIRES_IN` = `7d`
- [ ] All required variables set

---

## PART 4: DATABASE MIGRATION (2 min)

- [ ] Waited for deployment to complete
- [ ] Clicked service → "⋯" → "Run a Command"
- [ ] Ran: `npx prisma migrate deploy`
- [ ] Migration completed successfully
- [ ] No errors in output

---

## PART 5: GENERATE URL (1 min)

- [ ] Clicked service → "Settings"
- [ ] Found "Networking" section
- [ ] Clicked "Generate Domain"
- [ ] Got URL (like: https://xxx.railway.app)
- [ ] Copied URL for testing

---

## PART 6: TESTING (2 min)

- [ ] Opened: `https://YOUR-URL/health`
- [ ] Got response: `{"status":"ok",...}`
- [ ] Opened: `https://YOUR-URL/api-docs`
- [ ] Saw Swagger API documentation
- [ ] Tested user registration (see below)

**Test Registration:**
```bash
curl -X POST https://YOUR-URL/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"John","lastName":"Doe","role":"CUSTOMER"}'
```

- [ ] Got success response with token

---

## ✅ SUCCESS INDICATORS

Your deployment is successful if:

- ✅ Railway shows "Active" status
- ✅ /health returns JSON
- ✅ /api-docs shows Swagger UI
- ✅ Can register a test user
- ✅ No errors in Railway logs

---

## 📝 SAVE THESE

Write down your URLs:

**API Base URL:**  
`https://________________________________.railway.app`

**API Docs:**  
`https://________________________________.railway.app/api-docs`

**Railway Project:**  
`https://railway.app/project/________________________________`

---

## 🎉 DONE!

If all boxes are checked above:

**🎉 YOUR API IS LIVE ON THE INTERNET! 🎉**

---

## 🆘 TROUBLESHOOTING

**If build fails:**
- [ ] Check Railway logs for errors
- [ ] Verify all files were pushed to GitHub
- [ ] Check package.json exists in backend folder

**If database errors:**
- [ ] Verify PostgreSQL service is running
- [ ] Re-run migration command
- [ ] Check DATABASE_URL in variables (auto-set)

**If 500 errors:**
- [ ] Check all environment variables are set
- [ ] Verify JWT_SECRET is added
- [ ] Check service logs in Railway

**If still stuck:**
- [ ] Tell me which step failed
- [ ] Share the error message
- [ ] I'll help you fix it!

---

## 📊 POST-DEPLOYMENT

After successful deployment:

- [ ] Shared API URL with team
- [ ] Tested all main endpoints
- [ ] Set up Stripe keys (optional)
- [ ] Added custom domain (optional)
- [ ] Monitored Railway dashboard

---

## 🔄 UPDATING YOUR APP

When you make changes:

```bash
git add .
git commit -m "Description of changes"
git push
```

Railway automatically redeploys!

- [ ] Made changes locally
- [ ] Tested locally
- [ ] Committed to Git
- [ ] Pushed to GitHub
- [ ] Watched Railway auto-deploy
- [ ] Verified changes live

---

**DEPLOYMENT COMPLETED:** _________________ (date/time)

**DEPLOYED BY:** _________________ (your name)

**API URL:** ________________________________________

**STATUS:** [ ] Success [ ] Issues [ ] Need Help

---

Print Date: _______________
