# ⚡ Vercel CLI Setup & Deployment

**Vercel CLI Version:** 48.6.0 ✅ Installed
**Project:** https://vercel.com/pejmans-projects-75cd31ff/optimalflight

---

## 🔐 Step 1: Authenticate with Vercel (Choose One Method)

### Method A: Login Interactively (Easiest)

```bash
cd /Users/pejman/Documents/flight-optima
vercel login
```

This opens browser for authentication.

### Method B: Use Access Token (Recommended for automation)

**Get Your Token:**
1. Go to: https://vercel.com/account/tokens
2. Click **"Create Token"**
3. Name: `FlightOptima CLI`
4. Scope: Full Access (or select specific projects)
5. Expiration: No expiration (or set as needed)
6. Click **"Create Token"**
7. **COPY the token** (shown only once!)

**Set Token:**
```bash
export VERCEL_TOKEN="your_token_here"

# Or add to ~/.zshrc or ~/.bashrc:
echo 'export VERCEL_TOKEN="your_token_here"' >> ~/.zshrc
source ~/.zshrc
```

**Login with Token:**
```bash
vercel login --token $VERCEL_TOKEN
```

---

## 🔗 Step 2: Link to Existing Vercel Project

```bash
cd /Users/pejman/Documents/flight-optima

# Link to your existing Vercel project
vercel link
```

**You'll be asked:**
```
? Set up and deploy "~/Documents/flight-optima"? [Y/n]
> Y

? Which scope do you want to deploy to?
> Pejman's projects

? Link to existing project? [Y/n]
> Y

? What's the name of your existing project?
> optimalflight
```

This creates a `.vercel` directory with project config.

---

## 🎯 Step 3: Add Environment Variables

### Option A: Add via CLI (One by One)

```bash
# Add DATABASE_URL
vercel env add DATABASE_URL

# When prompted:
# Value: [paste Neon connection string]
# Environment: Production, Preview, Development

# Add AUTH_SECRET
vercel env add AUTH_SECRET

# Value: [run: openssl rand -base64 32]
# Environment: Production, Preview, Development

# Add TRIPBASE_DATABASE_URL (optional)
vercel env add TRIPBASE_DATABASE_URL

# Value: [from jetlag-revweb]
# Environment: Production, Preview, Development
```

### Option B: Add via Dashboard (Easier)

1. Go to: https://vercel.com/pejmans-projects-75cd31ff/optimalflight/settings/environment-variables
2. Click "Add New"
3. Add variables manually

### Option C: Pull from .env (If you have them locally)

```bash
# Create .env locally first
npm run setup

# Edit .env with your values
nano .env

# Push to Vercel (WARNING: This uploads all env vars)
vercel env pull
```

---

## 🚀 Step 4: Deploy to Production

### Deploy Current Code

```bash
# Deploy to production
vercel --prod

# Or just:
vercel
```

This will:
1. Build your app
2. Upload to Vercel
3. Deploy to production
4. Give you a live URL

### Watch the Build

```bash
# Deploy and follow logs
vercel --prod --logs
```

---

## 📊 Useful Vercel CLI Commands

### View Deployments

```bash
# List all deployments
vercel ls

# View latest deployment
vercel inspect
```

### View Logs

```bash
# Real-time logs
vercel logs

# Logs for specific deployment
vercel logs [deployment-url]
```

### Environment Variables

```bash
# List all env vars
vercel env ls

# Pull env vars to local .env
vercel env pull

# Add new env var
vercel env add [KEY]

# Remove env var
vercel env rm [KEY]
```

### Project Info

```bash
# Show project details
vercel project ls

# Show current project
vercel whoami
vercel teams ls
```

### Domains

```bash
# List domains
vercel domains ls

# Add custom domain
vercel domains add yourdomain.com
```

---

## 🎯 Quick Deploy Workflow

```bash
cd /Users/pejman/Documents/flight-optima

# 1. Make changes
# ... edit code ...

# 2. Test locally
npm run dev

# 3. Commit to git
git add .
git commit -m "Your changes"
git push

# 4. Deploy to Vercel
vercel --prod

# Done! Live in ~2 minutes
```

---

## 🔧 Troubleshooting

### "vercel: command not found"

```bash
# Reinstall globally
npm install -g vercel

# Or use npx
npx vercel --version
```

### "No token found"

```bash
# Login again
vercel login

# Or set token
export VERCEL_TOKEN="your_token_here"
```

### "Project not linked"

```bash
# Relink project
vercel link
```

### "Build failed"

```bash
# Test build locally first
npm run build

# Fix errors, then deploy
vercel --prod
```

### "Environment variable not found"

```bash
# List all env vars
vercel env ls

# Add missing var
vercel env add [KEY]
```

---

## ⚡ FASTEST PATH TO LIVE (3 Commands)

```bash
# 1. Login to Vercel
vercel login

# 2. Link to your existing project
vercel link
# Select: optimalflight

# 3. Deploy!
vercel --prod
```

**Then add environment variables via dashboard** (easier than CLI)

---

## 📋 Environment Variables You Need

### Required (Minimum)
```env
DATABASE_URL              # From Neon
AUTH_SECRET              # Generate: openssl rand -base64 32
```

### Recommended
```env
TRIPBASE_DATABASE_URL    # From jetlag-revweb (for airport data)
GITHUB_ID                # For GitHub OAuth
GITHUB_SECRET            # For GitHub OAuth
```

### Optional (Add Later)
```env
GOOGLE_ID                # For Google OAuth
GOOGLE_SECRET            # For Google OAuth
AMADEUS_API_KEY          # For real flight data
AMADEUS_API_SECRET       # For Amadeus
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN  # For maps
REDIS_URL                # For caching
```

---

## 🎯 Your Current Status

**✅ Vercel CLI:** Installed (v48.6.0)
**✅ GitHub:** All code pushed (298 files)
**✅ Vercel Project:** Created (optimalflight)
**⏳ Environment Variables:** Need to add
**⏳ Deployment:** Pending env vars

---

## 🚀 Next 3 Commands

```bash
# 1. Login
vercel login

# 2. Link
vercel link

# 3. Deploy
vercel --prod
```

**Then add DATABASE_URL and AUTH_SECRET in Vercel dashboard!**

---

**Your app will be LIVE at:** https://optimalflight.vercel.app 🎉

Want me to help you add the environment variables via CLI or should you add them via the Vercel dashboard (easier)?
