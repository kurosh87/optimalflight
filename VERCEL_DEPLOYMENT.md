# 🚀 Vercel Deployment Guide - FlightOptima

**Vercel Project:** https://vercel.com/pejmans-projects-75cd31ff/optimalflight
**Status:** Configuring...

---

## ⚡ Quick Setup (5 Minutes)

### Step 1: Add Environment Variables to Vercel

Go to: https://vercel.com/pejmans-projects-75cd31ff/optimalflight/settings/environment-variables

Add these **REQUIRED** variables:

```env
# Database (REQUIRED)
DATABASE_URL
Value: postgresql://user:password@ep-xxx.neon.tech/optimalflight?sslmode=require
(Get from: https://neon.tech)

# Auth Secret (REQUIRED)
AUTH_SECRET
Value: [Generate with: openssl rand -base64 32]

# TripBase Database for Airport Data (REQUIRED)
TRIPBASE_DATABASE_URL
Value: [Copy from your jetlag-revweb project]
```

### Step 2: Add OPTIONAL Variables (for full features)

```env
# GitHub OAuth (for sign in)
GITHUB_ID
GITHUB_SECRET
(Get from: https://github.com/settings/developers)
Update callback URL to: https://optimalflight.vercel.app/api/auth/callback/github

# Google OAuth (for sign in)
GOOGLE_ID
GOOGLE_SECRET
(Get from: https://console.cloud.google.com)
Update callback URL to: https://optimalflight.vercel.app/api/auth/callback/google

# Mapbox (for maps - can add later)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

# Amadeus (for real flight data - can add later)
AMADEUS_API_KEY
AMADEUS_API_SECRET

# Redis (optional - for caching)
REDIS_URL
```

### Step 3: Redeploy

After adding environment variables:

1. Go to: https://vercel.com/pejmans-projects-75cd31ff/optimalflight
2. Click **"Redeploy"** button
3. Wait for build to complete (~2 minutes)

---

## 🔧 If Build Fails

### Common Issues:

**1. "DATABASE_URL is not defined"**
→ Add DATABASE_URL in environment variables

**2. "Build failed with TypeScript errors"**
→ The build might have schema issues. Try:
```bash
# Locally:
npm run build
# Fix any errors, then:
git add . && git commit -m "Fix build errors" && git push
```

**3. "Missing dependencies"**
→ Check package.json is pushed to GitHub
→ Vercel will auto-install from package.json

**4. "Database connection failed"**
→ Make sure DATABASE_URL includes `?sslmode=require`
→ Make sure Neon project is not sleeping (free tier)

---

## 📋 Vercel Configuration Checklist

### Project Settings

**Build & Development Settings:**
- ✅ Framework: Next.js
- ✅ Build Command: `npm run build` (automatic)
- ✅ Output Directory: `.next` (automatic)
- ✅ Install Command: `npm install` (automatic)

**Root Directory:**
- ✅ `.` (default - whole repo)

**Node.js Version:**
- ✅ 20.x (recommended)

### Environment Variables (Add in Vercel Dashboard)

**Required (minimum to run):**
1. `DATABASE_URL` - Neon PostgreSQL
2. `AUTH_SECRET` - Generated secret
3. `TRIPBASE_DATABASE_URL` - Airport data source

**Optional (for full features):**
4. `GITHUB_ID` + `GITHUB_SECRET`
5. `GOOGLE_ID` + `GOOGLE_SECRET`
6. `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
7. `AMADEUS_API_KEY` + `AMADEUS_API_SECRET`
8. `REDIS_URL`

### Deployment Settings

**Production Branch:** main
**Auto-deploy:** ✅ Enabled
**Preview Deployments:** ✅ Enabled for Pull Requests

---

## 🎯 Quick Win Strategy

### Minimum Viable Deployment (Now):

Add ONLY these 2 variables:
1. `DATABASE_URL`
2. `AUTH_SECRET`

Then redeploy. App will run with:
- ✅ Homepage working
- ✅ Search page working (UI only, no real flight data yet)
- ✅ Routes page working
- ⚠️ Auth won't work (no OAuth configured yet)
- ⚠️ Airport search might not work (needs TRIPBASE_DATABASE_URL)

### Better Deployment (5 more minutes):

Add these 3 variables:
3. `TRIPBASE_DATABASE_URL`
4. `GITHUB_ID`
5. `GITHUB_SECRET`

Then redeploy. App will run with:
- ✅ Everything from above
- ✅ Airport autocomplete working!
- ✅ GitHub sign in working!

### Full Featured (15 minutes):

Add all optional variables, then you get:
- ✅ Google OAuth
- ✅ Real flight search (Amadeus)
- ✅ Interactive maps (Mapbox)
- ✅ Fast caching (Redis)

---

## 🔑 How to Get Required Values

### 1. DATABASE_URL (2 min)

**Option A: Create New Neon Database**
1. Go to https://neon.tech
2. Click "Create Project"
3. Name: "optimalflight"
4. Copy connection string
5. Should look like:
   ```
   postgresql://neondb_owner:abc123@ep-xxx.us-east-1.aws.neon.tech/optimalflight?sslmode=require
   ```

**Option B: Use Existing Neon**
- Use existing Neon project
- Create new database in it
- Copy connection string

### 2. AUTH_SECRET (30 sec)

Run locally:
```bash
openssl rand -base64 32
```

Copy the output (looks like: `Kx7fJ9mP3qR8sL2vN4wY6zB1cD5eF0gH...`)

### 3. TRIPBASE_DATABASE_URL (30 sec)

This is the database from your jetlag-revweb project that has all the airport data.

**Find it:**
```bash
# If you have jetlag-revweb deployed on Vercel:
# Go to jetlag-revweb Vercel settings → Environment Variables
# Copy TRIPBASE_DATABASE_URL or DATABASE_URL

# Or check local .env in jetlag-revweb
cat /Users/pejman/Projects/jetlag-revweb/.env.local | grep DATABASE
```

### 4. GITHUB_ID & GITHUB_SECRET (2 min)

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - Name: `FlightOptima Production`
   - Homepage: `https://optimalflight.vercel.app`
   - Callback: `https://optimalflight.vercel.app/api/auth/callback/github`
4. Click "Register application"
5. Copy Client ID → `GITHUB_ID`
6. Generate new client secret → `GITHUB_SECRET`

---

## 🚀 Deployment Steps

### 1. Add Environment Variables

Go to: https://vercel.com/pejmans-projects-75cd31ff/optimalflight/settings/environment-variables

Click **"Add New"** for each variable:

**Minimum (to get it running):**
- `DATABASE_URL` = [Neon connection string]
- `AUTH_SECRET` = [Generated secret]

**Better (for airport search):**
- `TRIPBASE_DATABASE_URL` = [From jetlag-revweb]

**Best (for full auth):**
- `GITHUB_ID` = [From GitHub OAuth]
- `GITHUB_SECRET` = [From GitHub OAuth]

### 2. Redeploy

After adding variables:
1. Go to: https://vercel.com/pejmans-projects-75cd31ff/optimalflight
2. Click **"Deployments"** tab
3. Click **"..."** on latest deployment
4. Click **"Redeploy"**
5. Wait ~2 minutes for build

### 3. Test Your App

Once deployed, visit:
```
https://optimalflight.vercel.app
```

Or whatever URL Vercel gives you!

---

## ✅ Success Criteria

After deployment, you should see:

- ✅ Homepage loads with hero section
- ✅ Can navigate to /search
- ✅ Can navigate to /routes
- ✅ Can navigate to /saved
- ✅ "Sign In" button appears (if GitHub OAuth configured)
- ✅ No console errors
- ✅ Airport autocomplete works (if TRIPBASE_DATABASE_URL set)

---

## 🐛 Troubleshooting

### Build Failed

**Check build logs:**
1. Go to Vercel project
2. Click "Deployments"
3. Click failed deployment
4. Read error messages

**Common fixes:**
- TypeScript errors → Fix locally, push to GitHub
- Missing env vars → Add in Vercel settings
- Database connection → Check DATABASE_URL format

### Build Succeeded but App Crashes

**Check runtime logs:**
1. Go to Vercel project
2. Click "Logs" tab
3. Look for errors

**Common fixes:**
- Database not accessible → Check Neon project is active
- Auth errors → Verify AUTH_SECRET is set
- API errors → Check all required env vars are set

### App Loads but Features Don't Work

**Airport search not working:**
→ Add TRIPBASE_DATABASE_URL

**Sign in not working:**
→ Add GITHUB_ID and GITHUB_SECRET
→ Update OAuth callback URL to match Vercel domain

**Flight search not working:**
→ Add AMADEUS_API_KEY and AMADEUS_API_SECRET

---

## 📊 Deployment Metrics

After successful deployment, you'll have:

**Performance:**
- ⚡ Global CDN (Vercel Edge Network)
- ⚡ Automatic image optimization
- ⚡ Edge functions for API routes
- ⚡ Instant cache invalidation

**Scalability:**
- 🚀 Serverless architecture
- 🚀 Auto-scaling
- 🚀 99.99% uptime SLA

**Developer Experience:**
- 🔄 Auto-deploy on git push
- 🔄 Preview deployments for PRs
- 🔄 Rollback in 1 click
- 🔄 Real-time logs

---

## 🎯 After It's Live

### 1. Get Your URL

Vercel will give you a URL like:
```
https://optimalflight.vercel.app
or
https://optimalflight-pejmans-projects.vercel.app
```

### 2. Add Custom Domain (Optional)

1. Buy domain (e.g., flightoptima.com)
2. Go to Vercel project → Settings → Domains
3. Add your domain
4. Update DNS records as instructed

### 3. Set Up Database

**Initial setup:**
```bash
# Locally (or use Vercel CLI)
npm run db:push
```

This creates all tables in your Neon database.

### 4. Import Data (Optional)

```bash
# Run locally to populate your Neon DB:
npm run import:airports
npm run import:airlines
```

Or use TRIPBASE_DATABASE_URL which already has data!

---

## 📞 Quick Command Reference

**View deployment:**
```bash
vercel ls
```

**View logs:**
```bash
vercel logs
```

**Pull environment variables:**
```bash
vercel env pull
```

**Deploy specific branch:**
```bash
vercel --prod
```

---

## 🎉 Success!

Once deployed, you'll have:

**Live URL:** https://optimalflight.vercel.app (or similar)

**Working Features:**
- ✅ Homepage
- ✅ Flight search UI
- ✅ Route explorer
- ✅ Saved routes
- ✅ Auth (if OAuth configured)
- ✅ Airport search (if TRIPBASE_DATABASE_URL set)

**Next Steps:**
- Share the URL
- Test all features
- Add Amadeus API for real flight data
- Add Mapbox for interactive maps
- Launch publicly!

---

## 🚨 IMPORTANT: Set These Variables NOW

**Go to Vercel Dashboard:**
https://vercel.com/pejmans-projects-75cd31ff/optimalflight/settings/environment-variables

**Add at minimum:**
1. `DATABASE_URL` (from Neon)
2. `AUTH_SECRET` (run: `openssl rand -base64 32`)

**Then click "Redeploy"**

---

**Your app will be LIVE in ~2 minutes!** 🚀

Let me know if you see any errors in the Vercel build logs and I'll help you fix them!
