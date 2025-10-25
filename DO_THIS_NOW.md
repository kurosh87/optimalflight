# ⚡ DO THIS NOW - 10 Minute Launch

## Step-by-Step (Copy & Paste)

### 1. Setup Environment (2 min)

```bash
cd /Users/pejman/Documents/flight-optima
npm run setup
```

This creates `.env` with auto-generated `AUTH_SECRET`.

### 2. Add Database URL (1 min)

**Option A: Create New Neon Database**
1. Go to [neon.tech](https://neon.tech)
2. Sign up (free)
3. Create project "flight-optima"
4. Copy connection string

**Option B: Use Existing Neon**
If you already have Neon from jetlag-revweb, create a new database there.

**Add to .env:**
```bash
nano .env
# or
code .env
```

Add this line:
```env
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/flight_optima?sslmode=require"
```

### 3. Add TripBase URL (30 sec)

From your jetlag-revweb project, copy the TRIPBASE_DATABASE_URL:

```bash
# Add to .env:
TRIPBASE_DATABASE_URL="postgresql://neondb_owner:npg_xxx@ep-xxx.neon.tech/neondb?sslmode=require"
```

This gives you access to the 7K+ airports already in jetlag-revweb!

### 4. Push Database Schema (1 min)

```bash
npm run db:push
```

This creates all tables in your Neon database.

### 5. Start Development Server (30 sec)

```bash
npm run dev
```

### 6. Test It Works (2 min)

Open browser:
- http://localhost:3000 - Homepage ✓
- http://localhost:3000/search - Search page ✓
- http://localhost:3000/routes - Routes ✓

### 7. Test Airport Search (1 min)

Try this URL directly:
```
http://localhost:3000/api/search/airports?query=SFO
```

Should return San Francisco airports!

### 8. Optional: Setup Auth (2 min)

**For GitHub OAuth:**
1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - Name: FlightOptima Local
   - Homepage: http://localhost:3000
   - Callback: http://localhost:3000/api/auth/callback/github
4. Copy Client ID and Secret to .env

---

## ✅ Success Checklist

After running the above, you should have:

- [ ] App running on localhost:3000
- [ ] Homepage loads with hero section
- [ ] Can navigate to /search page
- [ ] Airport autocomplete shows up
- [ ] Can click "Sign In" (may need OAuth setup)
- [ ] No console errors

---

## 🚨 Common Issues

### "DATABASE_URL is not defined"
→ You forgot step 2. Add DATABASE_URL to .env

### "TRIPBASE_DATABASE_URL is not defined"
→ Airport search API needs this. Add it to .env from jetlag-revweb

### "Failed to connect to database"
→ Check your DATABASE_URL is correct
→ Make sure Neon project is active

### "Module not found: @/components/..."
→ Run: `npm install` (make sure all deps installed)

### Airport search returns empty
→ TRIPBASE_DATABASE_URL not set or wrong
→ Or database doesn't have airport data yet

---

## 🎯 After It's Running

### Next 30 Minutes:
1. Import airport data: `npm run import:airports`
2. Import airline data: `npm run import:airlines`
3. Test search works end-to-end

### Next 2 Hours:
1. Get Amadeus API key (https://developers.amadeus.com)
2. Integrate real flight search
3. Test jetlag scoring

### Next Day:
1. Deploy to Vercel
2. Share with friends
3. Get feedback

---

## 📞 Quick Reference

**Project Location:**
```
/Users/pejman/Documents/flight-optima
```

**Essential Commands:**
```bash
npm run dev              # Start app
npm run db:push          # Setup database
npm run setup            # Create .env
npm run import:all       # Import data
```

**Key Files:**
```
.env                     # Your secrets (create from .env.example)
src/app/page.tsx         # Homepage
src/app/search/page.tsx  # Search page
```

---

## 🎉 You're Ready!

Just run those 8 steps above and you'll have a working FlightOptima in 10 minutes.

**GO! 🚀**

---

*P.S. - If you run into ANY issues, check QUICKSTART.md or SETUP.md for more detailed instructions.*
