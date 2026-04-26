# PawGlobal — Vercel Deployment Guide

Complete step-by-step guide to deploy PawGlobal on Vercel (free tier supported).

---

## What You're Deploying

| Component | Where it runs |
|-----------|--------------|
| **Frontend** (React app) | Vercel CDN — global edge network, zero config |
| **API** (Express server) | Vercel Serverless Functions — auto-scales |
| **Database** (PostgreSQL) | Neon / Supabase / Railway — free tier available |

**Admin accounts** and the **product catalogue** (dogs, cats, supplies) are stored in the browser's local storage — no database required for those. The database only stores orders, donations, and admin settings.

---

## What's in This Package

```
vercel-deploy/
├── vercel.json        ← Vercel routing configuration
├── api/
│   └── index.js      ← Express API (serverless function)
├── public/            ← Pre-built React frontend (ready to serve)
│   ├── index.html
│   └── assets/
├── package.json       ← Dependencies for the API
├── schema.sql         ← Database setup (run once)
├── .env.example       ← Environment variables template
└── VERCEL_SETUP_GUIDE.md  ← This file
```

---

## Step 1 — Create a PostgreSQL Database (Free)

PawGlobal needs a PostgreSQL database. The easiest free option is **Neon**.

### Option A: Neon (Recommended — Generous Free Tier)

1. Go to **https://neon.tech** and sign up (free)
2. Click **New Project** → give it a name (e.g. `pawglobal`)
3. Select region closest to your users (e.g. `eu-west-2` for Europe)
4. Click **Create Project**
5. Copy the **Connection String** — it looks like:
   ```
   postgresql://user:password@ep-xxx.eu-west-2.aws.neon.tech/neondb?sslmode=require
   ```
6. Keep this — you'll need it as `DATABASE_URL`

### Option B: Supabase (also free)

1. Go to **https://supabase.com** → New Project
2. In your project: **Settings** → **Database** → **Connection String** → **URI**
3. Replace `[YOUR-PASSWORD]` with your project password

### Option C: Railway

1. Go to **https://railway.app** → New Project → PostgreSQL
2. Click on the PostgreSQL service → **Variables** → copy `DATABASE_URL`

---

## Step 2 — Set Up the Database Tables

You need to run `schema.sql` once to create the tables.

### Method A: Using the database provider's SQL editor (easiest, no tools needed)

**Neon:**
1. In your Neon project → **SQL Editor**
2. Paste the entire contents of `schema.sql`
3. Click **Run**

**Supabase:**
1. In your Supabase project → **SQL Editor** → **New query**
2. Paste the entire contents of `schema.sql`
3. Click **Run**

### Method B: Using psql in your terminal

```bash
psql "postgresql://user:password@host:5432/dbname?sslmode=require" -f schema.sql
```

> The `schema.sql` file includes optional sample data (3 test records — a pet order, a donation, and a WhatsApp order). Remove those `INSERT` statements at the bottom before going live with real customers, or simply leave them and delete the test records from the Admin Panel later.

---

## Step 3 — Deploy to Vercel

### Method A: Vercel CLI (Recommended)

1. **Install the Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Unzip the package** and navigate into the folder:
   ```bash
   tar -xzf pawglobal-vercel.tar.gz
   cd vercel-deploy
   ```

3. **Log in to Vercel:**
   ```bash
   vercel login
   ```

4. **Deploy:**
   ```bash
   vercel
   ```
   When prompted:
   - Set up and deploy? → **Y**
   - Which scope? → select your account
   - Link to existing project? → **N** (new project)
   - Project name? → `pawglobal` (or anything you like)
   - Directory? → `.` (current directory)
   - Override settings? → **N**

5. Vercel will give you a preview URL like `https://pawglobal-xxx.vercel.app`

6. **Set environment variables** (see Step 4), then run:
   ```bash
   vercel --prod
   ```
   This deploys to production.

### Method B: GitHub + Vercel Dashboard (No CLI needed)

1. Push the contents of `vercel-deploy/` to a GitHub repository
2. Go to **https://vercel.com** → **Add New Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `.` (the repo root)
   - **Build Command**: *(leave empty — frontend is pre-built)*
   - **Output Directory**: `public`
   - **Install Command**: `npm install`
5. Add environment variables (see Step 4)
6. Click **Deploy**

---

## Step 4 — Set Environment Variables in Vercel

**In the Vercel Dashboard:**
1. Go to your project → **Settings** → **Environment Variables**
2. Add each variable below, set it for **Production**, **Preview**, and **Development**:

| Variable | Value | Required? |
|----------|-------|-----------|
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` | **Yes** |
| `STRIPE_SECRET_KEY` | `sk_live_...` | For payments |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | For payments |
| `SMTP_HOST` | `mail.yourdomain.com` | For emails |
| `SMTP_PORT` | `587` | For emails |
| `SMTP_USER` | `hello@yourdomain.com` | For emails |
| `SMTP_PASSWORD` | `your_password` | For emails |
| `SMTP_FROM_NAME` | `PawGlobal` | For emails |
| `SMTP_FROM_EMAIL` | `hello@yourdomain.com` | For emails |

**Via CLI:**
```bash
vercel env add DATABASE_URL
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_PUBLISHABLE_KEY
# ... etc
```

> **Note:** Stripe keys and SMTP settings can also be entered directly in the **Admin Panel → Settings** after you deploy. Values set there override these environment variables. So you can deploy first, then configure from the admin panel.

---

## Step 5 — Connect a Custom Domain (Optional)

1. In Vercel Dashboard → your project → **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g. `pawglobal.com` or `store.yourdomain.com`)
4. Vercel will show you DNS records to add

**DNS changes to make at your domain registrar:**

| Type | Name | Value |
|------|------|-------|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

Vercel automatically provisions a free SSL/TLS certificate (HTTPS) within a few minutes.

---

## Step 6 — First Login & Configuration

1. Open your Vercel URL (or custom domain)
2. Navigate to `/admin`
3. Log in with the default admin credentials:
   - **Email:** `admin@pawglobal.com`
   - **Password:** `pawglobal2024`
4. **Immediately update these in the Admin Panel:**
   - Change your admin password (Admin → Accounts → Change Password)
   - Add Stripe keys (Admin → Settings → Stripe) — if not set via env vars
   - Configure SMTP (Admin → Settings → SMTP)
   - Set WhatsApp / Telegram numbers if you want messaging checkout

---

## Local Development

To run the API locally for testing:

```bash
# 1. Navigate into the vercel-deploy folder
cd vercel-deploy

# 2. Install dependencies
npm install

# 3. Create a .env file
cp .env.example .env
# Fill in at minimum: DATABASE_URL

# 4. Start the API server (runs on port 3001)
node api/index.js
```

The API will be available at `http://localhost:3001/api/health`

For the full app locally, you'll need to also run the React development server from the Replit project.

---

## Updating the App

When you make changes on Replit and want to redeploy:

1. Run the build script on Replit:
   ```bash
   bash hostinger-deploy/build-and-package.sh
   ```
2. Copy the new built files from `artifacts/pawglobal/dist/public/` into `vercel-deploy/public/`
3. Run `vercel --prod` to push the update

---

## Architecture Notes

### Why is the product catalogue not in the database?
The product catalogue (dogs, cats, pet supplies) is stored in the browser's **local storage**. This means:
- Products can be added/edited instantly from the Admin Panel without any server
- Each admin's product changes appear live on their device immediately
- There is no "sync" needed — the data is client-side

### Why are orders in the database?
Orders and donations need to be persistent and accessible from any device, so they're stored in PostgreSQL. The database also stores:
- Store settings (Stripe keys, SMTP config, checkout method)
- Order tracking events

### Serverless cold starts
Vercel runs the API as serverless functions. After a period of inactivity (~5 minutes), the first request may take 1-3 seconds to "warm up." This is normal and doesn't affect the user experience for active stores.

---

## Troubleshooting

### "Function failed to execute" on API routes
- Check environment variables are set in Vercel Dashboard → Settings → Environment Variables
- Check the function logs: Vercel Dashboard → Deployments → click deployment → **Functions** tab → click `api/index`

### "DATABASE_URL is not set"
- Add `DATABASE_URL` in Vercel Dashboard → Settings → Environment Variables
- Redeploy after adding env vars: `vercel --prod`

### Frontend loads but API calls fail (CORS errors)
- Make sure your deployment URL matches what Vercel assigned
- The API uses `cors({ origin: true })` so all origins are allowed by default

### Stripe payments not working
- Confirm `STRIPE_SECRET_KEY` starts with `sk_live_` (not `sk_test_`) for production
- Check the Vercel function logs for the exact Stripe error message

### Emails not sending
- Use the Admin Panel → Settings → SMTP → **Send Test Email** to diagnose
- Gmail requires an **App Password** (not your normal password) if 2FA is enabled
- Some email providers block outbound SMTP on port 587 — try port 465

### Pages return 404 on direct URL access
- This is an SPA routing issue. The `vercel.json` catch-all rule should handle it:
  ```json
  { "src": "/(.*)", "dest": "/public/index.html" }
  ```
- If it persists, redeploy from scratch with `vercel --prod`

---

## Security Checklist Before Going Live

- [ ] Changed the default admin password from `pawglobal2024`
- [ ] Stripe keys are **live** keys (`sk_live_...`), not test keys
- [ ] HTTPS is active (Vercel provides this automatically)
- [ ] `DATABASE_URL` uses `?sslmode=require` (included in Neon/Supabase connection strings)
- [ ] Removed sample data from `schema.sql` or deleted test orders in Admin Panel
- [ ] SMTP is configured and test email works
- [ ] Admin Panel is not publicly linked from the storefront

---

## Free Tier Limits

| Service | Free Tier Limit |
|---------|----------------|
| Vercel | 100GB bandwidth/month, unlimited deployments |
| Neon | 512MB storage, 1 compute unit |
| Supabase | 500MB database, 2GB bandwidth |

For most small-to-medium pet stores, the free tiers are more than sufficient.
