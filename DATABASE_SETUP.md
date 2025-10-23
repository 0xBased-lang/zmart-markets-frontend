# 🗄️ ZMART Database Setup Guide

**Goal**: Set up Supabase database for 10x faster performance
**Time**: 15-20 minutes for setup
**Benefits**: Fast page loads, search, analytics, historical data

---

## STEP 1: Create Supabase Project (5 minutes)

### 1.1 Sign Up / Log In
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email

### 1.2 Create New Project
1. Click "New Project"
2. **Project Name**: `zmart-devnet`
3. **Database Password**: Generate strong password (SAVE THIS!)
4. **Region**: Choose closest to you (e.g., `US West` if in USA)
5. **Pricing Plan**: Free tier is fine for now
6. Click "Create new project"
7. Wait ~2 minutes for provisioning

### 1.3 Get Your Credentials
Once project is ready:

1. Go to **Settings** (gear icon) → **API**
2. Copy these values (YOU'LL NEED THEM):

```bash
# Project URL
https://xxxxxxxxxxxxx.supabase.co

# API Key (anon/public)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI...

# Service Role Key (KEEP SECRET!)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI...
```

---

## STEP 2: Run Database Schema (5 minutes)

### 2.1 Open SQL Editor
1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New Query**

### 2.2 Copy & Paste Schema
Copy the ENTIRE contents of `schema.sql` (I'll create this next)

### 2.3 Execute
1. Click **Run** button (or Cmd/Ctrl + Enter)
2. Verify "Success. No rows returned" message
3. Go to **Table Editor** → Should see 5 tables created!

---

## STEP 3: Add Credentials to Project (3 minutes)

### 3.1 Update .env.local
Add these lines to your `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Replace with YOUR actual values!**

### 3.2 Add to Vercel
```bash
cd zmart-frontend

# Add each variable
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

When prompted, paste your actual values.

---

## STEP 4: Install Supabase Client (2 minutes)

```bash
cd zmart-frontend
npm install @supabase/supabase-js
```

---

## STEP 5: Verify Setup

### 5.1 Test Connection
I'll create a test script. Run:

```bash
cd zmart-frontend
node scripts/test-supabase.js
```

Should see:
```
✅ Supabase connected successfully!
✅ Tables found: markets, user_bets, proposals, proposal_votes, market_stats
```

### 5.2 Check Tables
In Supabase dashboard:
1. Go to **Table Editor**
2. Should see all 5 tables (empty for now)

---

## TROUBLESHOOTING

### "Invalid API key"
- Double-check you copied the full key (they're very long!)
- Make sure using `NEXT_PUBLIC_SUPABASE_ANON_KEY` (not service role)
- Check for extra spaces

### "Network error"
- Check Project URL is correct
- Ensure project is fully provisioned (green status)
- Try refreshing Supabase dashboard

### "Tables not created"
- Re-run the schema.sql in SQL Editor
- Check for error messages in SQL output
- Verify you're in the correct project

---

## NEXT STEPS

Once setup is complete:
1. ✅ Run indexer to populate database
2. ✅ Update frontend to use database
3. ✅ Add search & filters
4. ✅ Deploy to production

**Ready?** Tell me when setup is done and I'll build the indexer!
