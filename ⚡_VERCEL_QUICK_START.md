# ⚡ VERCEL QUICK START - Do This Now!

**Your Vercel Project:** https://vercel.com/pejmans-projects-75cd31ff/optimalflight

---

## 🎯 3 Steps to Get Live (5 Minutes)

### STEP 1: Create Neon Database (2 min)

1. Go to https://neon.tech
2. Sign in (or create account)
3. Click **"Create Project"**
4. Name: `optimalflight`
5. Region: Choose closest to you
6. Click **"Create Project"**
7. **COPY the connection string** - looks like:
   ```
   postgresql://neondb_owner:abc123xyz...@ep-cool-field-12345678.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### STEP 2: Add to Vercel (2 min)

Go to: https://vercel.com/pejmans-projects-75cd31ff/optimalflight/settings/environment-variables

Click **"Add New"** and add:

**Variable 1:**
- Name: `DATABASE_URL`
- Value: [Paste Neon connection string]
- Environment: Production, Preview, Development (check all)
- Click **"Save"**

**Variable 2:**
- Name: `AUTH_SECRET`
- Value: [Run locally: `openssl rand -base64 32` and paste result]
- Environment: Production, Preview, Development (check all)
- Click **"Save"**

**Variable 3 (Optional but recommended):**
- Name: `TRIPBASE_DATABASE_URL`
- Value: [From your jetlag-revweb project - same as DATABASE_URL there]
- Environment: Production, Preview, Development
- Click **"Save"**

### STEP 3: Redeploy (1 min)

1. Go to: https://vercel.com/pejmans-projects-75cd31ff/optimalflight
2. Click **"Deployments"** tab
3. On the latest deployment, click the **"..."** menu
4. Click **"Redeploy"**
5. Click **"Redeploy"** again to confirm
6. Wait ~2 minutes

---

## ✅ You're Live!

Once build completes, visit your app at:

```
https://optimalflight.vercel.app
```

(Or whatever URL Vercel assigns)

You should see:
- ✅ Beautiful homepage
- ✅ Working navigation
- ✅ Search page
- ✅ Routes page
- ✅ Saved routes page

---

## 🔥 If You See Errors

### Build Error: "DATABASE_URL is not defined"
→ You forgot to add DATABASE_URL in Vercel
→ Go back to Step 2

### Build Error: TypeScript errors
→ Run locally: `npm run build`
→ Fix errors
→ Push to GitHub: `git add . && git commit -m "Fix build" && git push`
→ Vercel auto-redeploys

### Runtime Error: "Can't connect to database"
→ Check Neon project is active (wake it up by visiting Neon dashboard)
→ Verify DATABASE_URL is correct
→ Make sure it ends with `?sslmode=require`

### Homepage loads but features don't work
→ That's OK! You need to:
1. Run `npm run db:push` locally to create tables
2. Or push schema via Neon dashboard
3. Add TRIPBASE_DATABASE_URL for airport search

---

## 🎯 After It's Live

### Test These:

1. **Homepage** - Should load beautifully ✓
2. **Navigation** - Click Search, Routes, Saved ✓
3. **Search Page** - Form should display ✓
4. **Airport Search** - Try typing "SFO" (needs TRIPBASE_DATABASE_URL)
5. **Auth** - Try sign in (needs GitHub OAuth configured)

### Next Steps:

1. **Set up database schema:**
   ```bash
   # Locally:
   npm run db:push
   ```

2. **Configure OAuth** (optional):
   - GitHub OAuth app
   - Google OAuth app
   - Add to Vercel env vars

3. **Add flight data:**
   - Get Amadeus API key
   - Add to Vercel env vars
   - Test real flight search

---

## 🚀 You're 99% There!

**Just need to:**
1. Add DATABASE_URL to Vercel (2 min)
2. Add AUTH_SECRET to Vercel (30 sec)
3. Click Redeploy (1 min)

**Then you're LIVE!** 🎉

---

**Vercel Project:** https://vercel.com/pejmans-projects-75cd31ff/optimalflight

**Do this NOW:**
1. Go to Settings → Environment Variables
2. Add DATABASE_URL and AUTH_SECRET
3. Redeploy

**See you on the other side!** 🚀
