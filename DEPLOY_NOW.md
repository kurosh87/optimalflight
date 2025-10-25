# 🚀 DEPLOY FLIGHTOPTIMA NOW!

**Vercel CLI:** ✅ Installed & Authenticated
**Project Linked:** ✅ pejmans-projects-75cd31ff/flight-optima
**Status:** Ready to add env vars and deploy!

---

## ⚡ 3 Steps to Go Live (5 Minutes)

### Step 1: Add Required Environment Variables (3 min)

You need **2 environment variables minimum** to get it running:

#### Add DATABASE_URL:

```bash
vercel env add DATABASE_URL production preview development --token 85CRjW6q2BObZRo7YIUYAOzg
```

When prompted, paste your Neon database connection string:
```
postgresql://user:password@ep-xxx.neon.tech/optimalflight?sslmode=require
```

**Don't have DATABASE_URL yet?** Create it:
1. Go to https://neon.tech
2. Create project "optimalflight"
3. Copy connection string

#### Add AUTH_SECRET:

```bash
# Generate secret first
openssl rand -base64 32

# Then add to Vercel
vercel env add AUTH_SECRET production preview development --token 85CRjW6q2BObZRo7YIUYAOzg
```

Paste the generated secret when prompted.

#### Add TRIPBASE_DATABASE_URL (Optional - for airport search):

```bash
vercel env add TRIPBASE_DATABASE_URL production preview development --token 85CRjW6q2BObZRo7YIUYAOzg
```

Paste the database URL from your jetlag-revweb project.

---

### Step 2: Deploy to Production (1 min)

```bash
vercel --prod --token 85CRjW6q2BObZRo7YIUYAOzg
```

This will:
- Build your app (~2 minutes)
- Deploy to production
- Give you a live URL

---

### Step 3: Visit Your Live App! (30 sec)

```bash
# After deployment completes, you'll see:
✅ Production: https://flight-optima-xyz.vercel.app
```

Visit that URL and see FlightOptima LIVE! 🎉

---

## 🎯 Alternative: Add Env Vars via Dashboard

**Easier for first time:**

1. Go to: https://vercel.com/pejmans-projects-75cd31ff/flight-optima/settings/environment-variables

2. Click **"Add New"**

3. Add these variables:
   - `DATABASE_URL` → [Neon connection string]
   - `AUTH_SECRET` → [Run: `openssl rand -base64 32`]
   - `TRIPBASE_DATABASE_URL` → [From jetlag-revweb] (optional)

4. Select all environments (Production, Preview, Development)

5. Click **"Save"**

6. Then deploy:
   ```bash
   vercel --prod --token 85CRjW6q2BObZRo7YIUYAOzg
   ```

---

## 📝 Note: Two Vercel Projects

You now have 2 projects on Vercel:

1. **optimalflight** (created via web dashboard)
   - https://vercel.com/pejmans-projects-75cd31ff/optimalflight

2. **flight-optima** (created via CLI link)
   - https://vercel.com/pejmans-projects-75cd31ff/flight-optima

**You can:**
- Use **flight-optima** (just linked via CLI) ← Easiest
- Delete flight-optima and use **optimalflight** instead
- Keep both (one for staging, one for production)

**Recommendation:** Use the CLI-linked **flight-optima** for now. It's already configured!

---

## 🚀 SIMPLEST DEPLOYMENT (Copy/Paste)

```bash
cd /Users/pejman/Documents/flight-optima

# Add DATABASE_URL
vercel env add DATABASE_URL production preview development --token 85CRjW6q2BObZRo7YIUYAOzg
# Paste: postgresql://...

# Add AUTH_SECRET
openssl rand -base64 32
# Copy the output, then:
vercel env add AUTH_SECRET production preview development --token 85CRjW6q2BObZRo7YIUYAOzg
# Paste the secret

# Deploy!
vercel --prod --token 85CRjW6q2BObZRo7YIUYAOzg
```

---

## ✅ Success Checklist

After deployment:

- [ ] Build completes successfully
- [ ] Deployment URL received
- [ ] Homepage loads
- [ ] Can navigate to /search
- [ ] Can navigate to /routes
- [ ] No critical errors in logs

---

## 🎉 YOU'RE 3 COMMANDS AWAY FROM LIVE!

1. **Add DATABASE_URL** (required)
2. **Add AUTH_SECRET** (required)
3. **Deploy!** (`vercel --prod`)

**GO DEPLOY!** 🚀

---

**Vercel CLI Token:** (already authenticated)
**Project:** flight-optima (linked)
**Status:** Ready to deploy!
