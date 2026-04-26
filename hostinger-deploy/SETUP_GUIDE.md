# PawGlobal — Hostinger Deployment Guide

Complete step-by-step guide to deploy PawGlobal on a Hostinger Node.js server.

---

## Architecture Overview

| Component | What it does |
|-----------|-------------|
| `server.js` | Node.js/Express server — handles all API routes AND serves the frontend |
| `public/` | Built React frontend (static HTML, CSS, JS) |
| PostgreSQL | Stores orders, donations, and store settings |
| `.env` | Your environment variables (Stripe keys, DB URL, SMTP, etc.) |

> **What lives in the browser** (no server needed):
> - Product catalog (dogs, cats, supplies) — stored in browser localStorage
> - Admin accounts and login — stored in browser localStorage
>
> **What lives in the database:**
> - All orders and donations
> - Store settings (Stripe keys, SMTP config, checkout method, etc.)

---

## Step 1 — Build the Frontend (on Replit)

Run the build script from the Replit terminal:

```bash
bash hostinger-deploy/build-and-package.sh
```

This:
1. Builds the React frontend with Vite (production mode)
2. Copies everything into `hostinger-deploy/dist/`
3. Creates `hostinger-deploy/pawglobal-hostinger.zip`

Download the zip from the Replit file browser.

---

## Step 2 — Set Up PostgreSQL on Hostinger

### Option A: Hostinger hPanel (if PostgreSQL is available on your plan)

1. Log in to **hPanel** → **Databases** → **PostgreSQL Databases**
2. Create a new database, e.g. `pawglobal_db`
3. Create a new database user with a strong password
4. Grant the user all privileges on the database
5. Note the **host**, **port** (usually 5432), **database name**, **user**, and **password**

Your `DATABASE_URL` will be:
```
postgresql://USERNAME:PASSWORD@localhost:5432/pawglobal_db
```

### Option B: External PostgreSQL (Neon, Supabase, Railway — Free tier)

If your Hostinger plan doesn't include PostgreSQL, use a free cloud provider:

- **Neon** → https://neon.tech (recommended — generous free tier)
- **Supabase** → https://supabase.com
- **Railway** → https://railway.app

All three give you a `postgresql://...` connection string to paste into your `.env`.

### Create the database tables

Once you have your PostgreSQL connection, run the schema file:

```bash
psql "postgresql://USER:PASSWORD@HOST:5432/DBNAME" -f schema.sql
```

Or paste the contents of `schema.sql` into your database provider's SQL editor.

---

## Step 3 — Upload Files to Hostinger

### Via File Manager (hPanel)
1. Open hPanel → **File Manager**
2. Navigate to your Node.js app directory (usually `~/domains/yourdomain.com/public_html/` or the root your Node.js app is pointed to)
3. Upload `pawglobal-hostinger.zip`
4. Extract the zip → you'll see a `dist/` folder
5. Move all contents of `dist/` to your app root

Your app directory should look like:
```
your-app-root/
├── server.js        ← Main entry point
├── package.json
├── .env.example
├── schema.sql
└── public/          ← Built React frontend
    ├── index.html
    ├── assets/
    └── ...
```

### Via SSH (recommended)
```bash
# SSH into your Hostinger server
ssh u123456789@yourdomain.com

# Navigate to your app directory
cd ~/domains/yourdomain.com

# Upload the zip first (use SFTP), then:
unzip pawglobal-hostinger.zip
cp -r dist/* .
rm -rf dist/ pawglobal-hostinger.zip
```

---

## Step 4 — Configure Environment Variables

### Create your .env file
```bash
cp .env.example .env
nano .env     # or use your preferred editor
```

Fill in these required values:

```env
# Server
PORT=3000
NODE_ENV=production

# Database (required)
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASS@localhost:5432/YOUR_DB

# Stripe (required for card payments)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# SMTP Email (optional but recommended)
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=hello@yourdomain.com
SMTP_PASSWORD=your_email_password
SMTP_FROM_NAME=PawGlobal
SMTP_FROM_EMAIL=hello@yourdomain.com
```

### Setting ENV vars via Hostinger hPanel
If your Hostinger plan supports environment variables in hPanel:
1. Go to **Hosting** → **Node.js** → your app → **Environment Variables**
2. Add each key-value pair from your `.env` file
3. This is more secure than keeping a `.env` file on the server

---

## Step 5 — Install Dependencies & Start the Server

```bash
# Install production dependencies only
npm install --production

# Run the schema (if not done yet)
psql "$DATABASE_URL" -f schema.sql

# Test the server
node server.js
```

You should see:
```
✅  Database connected
🐾  PawGlobal server running on port 3000
    Environment: production
    API:         http://localhost:3000/api/health
    Frontend:    http://localhost:3000/
```

---

## Step 6 — Configure Hostinger to Run Node.js

### In hPanel → Node.js:
1. Go to **hPanel** → **Advanced** → **Node.js**
2. Set the **Application root** to your app directory
3. Set the **Application startup file** to `server.js`
4. Set Node.js version to **18** or **20**
5. Click **Create** / **Restart**

Hostinger uses **Passenger** to manage Node.js apps, so you don't need PM2 separately.

### If using PM2 via SSH:
```bash
npm install -g pm2
pm2 start server.js --name "pawglobal"
pm2 startup     # auto-start on reboot
pm2 save
```

---

## Step 7 — Point Your Domain

In **hPanel** → **Domains** → **Domain Name** → **Manage**:
- Point your domain's A record to your Hostinger server IP
- SSL/HTTPS is handled automatically by Hostinger (Let's Encrypt)

If the app is behind Hostinger's reverse proxy, the server will correctly pick up the real client IP.

---

## Step 8 — First Login & Configuration

1. Open your domain in a browser (e.g. `https://yourdomain.com`)
2. Navigate to `/admin` (e.g. `https://yourdomain.com/admin`)
3. Log in with the default credentials:
   - **Email:** `admin@pawglobal.com`
   - **Password:** `pawglobal2024`
4. **Immediately go to Admin → Settings and:**
   - Add your Stripe keys (if not in `.env`)
   - Configure SMTP for email notifications
   - Set WhatsApp / Telegram numbers if using messaging checkout
   - Change the admin password via the Accounts section

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Port the server listens on (Hostinger sets this automatically) |
| `NODE_ENV` | Yes | Set to `production` |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `STRIPE_SECRET_KEY` | For payments | Stripe secret key (`sk_live_...`) |
| `STRIPE_PUBLISHABLE_KEY` | For payments | Stripe publishable key (`pk_live_...`) |
| `SMTP_HOST` | For emails | Your SMTP server hostname |
| `SMTP_PORT` | For emails | Usually `587` (TLS) or `465` (SSL) |
| `SMTP_USER` | For emails | Your email address / username |
| `SMTP_PASSWORD` | For emails | Your email password or app password |
| `SMTP_FROM_NAME` | For emails | Display name (e.g. `PawGlobal`) |
| `SMTP_FROM_EMAIL` | For emails | From address (e.g. `hello@yourdomain.com`) |

> **Note:** Stripe keys and SMTP settings can also be set via the Admin Panel at `/admin/settings` — those values override the environment variables.

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `store_settings` | Key-value store for all admin settings |
| `orders` | All purchase orders and donation records |

The `schema.sql` file creates both tables and all necessary indexes.

---

## Common Issues & Solutions

### App starts but shows "Cannot GET /"
- The `public/` directory is empty or missing `index.html`
- Re-run the build script and make sure you copied the output correctly

### "Database connection failed"
- Check your `DATABASE_URL` format: `postgresql://user:pass@host:5432/dbname`
- If on a remote DB, ensure your Hostinger server IP is whitelisted
- Run `psql "$DATABASE_URL" -c "SELECT 1"` to test the connection

### "Stripe secret key is not configured"
- Add `STRIPE_SECRET_KEY` to your `.env` or set it via Admin → Settings → Stripe

### Emails not sending
- Test SMTP via Admin → Settings → SMTP → Send Test Email
- Make sure port 587 isn't blocked by your host (some block it; try 465)
- Gmail requires an App Password if 2FA is enabled

### Port already in use
- Hostinger sets the port automatically via the `PORT` env var
- Make sure your app uses `process.env.PORT` (it does by default)

### Admin login not working after fresh deploy
- Admin accounts are stored in **browser localStorage**, not the database
- On a fresh browser (no localStorage), the default credentials are: `admin@pawglobal.com` / `pawglobal2024`
- Clearing browser data / using a different browser will reset to defaults

---

## Updating the App

When you make changes on Replit and want to redeploy:

1. Run `bash hostinger-deploy/build-and-package.sh` on Replit
2. Download the new zip
3. SSH into Hostinger and replace the files:
```bash
cd ~/domains/yourdomain.com
unzip -o new-package.zip
cp -r dist/* .
npm install --production
pm2 restart pawglobal   # or restart via hPanel
```

---

## Security Checklist

- [ ] Changed the default admin password (`admin@pawglobal.com` / `pawglobal2024`)
- [ ] Set `NODE_ENV=production` in your environment
- [ ] Using HTTPS (SSL certificate active)
- [ ] Stripe keys are live keys, not test keys
- [ ] `.env` file is not publicly accessible (it's server-side only)
- [ ] Database password is strong and unique
- [ ] SMTP password is an App Password (not your main email password)

---

## Support

If you run into issues not covered here, check:
- Node.js logs: `pm2 logs pawglobal` or Hostinger's error log in hPanel
- API health: `curl https://yourdomain.com/api/health`
- Database: Test the SQL connection string manually with `psql`
