# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Artifacts

### PawGlobal Pet Store (`artifacts/pawglobal`)
A fully global international online pet store. Built with React + Vite.

**Pages:**
- `/` — Homepage with hero, mission, featured pets, testimonials, donation highlight
- `/shop/dogs` — Dogs & puppies grid with search/filter
- `/shop/cats` — Cats & kittens grid with search/filter
- `/shop/supplies` — Pet supplies grid with category filter
- `/shop/:id` — Dynamic product detail page
- `/donate` — Donation page with preset amounts, impact tracker, shelter selection
- `/cart` — Shopping cart with multi-currency display
- `/checkout` — Checkout form (Stripe only, global country list)
- `/checkout/success` — Post-payment success page (verifies Stripe session)
- `/about` — Brand story and global shelter partnerships
- `/contact` — Contact form with Zod validation
- `/admin/login` — Admin email+password login (email: admin@pawglobal.com / pass: pawglobal2024)
- `/admin/signup` — Create new admin account (requires invite code: pawglobal-invite)
- `/admin` — Dashboard (protected)
- `/admin/dogs` — Manage dog listings CRUD
- `/admin/cats` — Manage cat listings CRUD
- `/admin/supplies` — Manage supply listings CRUD
- `/admin/settings` — Store settings, email notifications, Stripe status, password change, admin users
- `/admin/orders` — All Stripe-confirmed orders and donations with search, filter, CSV export
- `/my-orders` — Public customer order lookup by email (no login required)
- `/donate/success` — Post-donation success page

**Key features:**
- Dark/light mode toggle
- Multi-currency (NGN, USD, EUR, GBP) with converter
- Cart system with localStorage persistence
- Client-side search and filtering for all shop pages
- Framer Motion scroll animations and page transitions
- Responsive mobile-first design (terracotta/cream palette)
- Admin panel with email+password auth, multi-admin support, CRUD for all listings
- Admin settings: store info, email notification config, payment status, password change
- Stripe checkout integration (api-server creates sessions; requires STRIPE_SECRET_KEY)
- Admin data persisted in localStorage, reflected immediately on public store

**Tech stack:**
- React + Vite + TypeScript
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod
- Framer Motion animations
- Wouter routing
- All data from `src/lib/data.ts` (no backend required)

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/pawglobal run dev` — run PawGlobal frontend

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Email Notifications

Transactional emails are sent via SMTP using nodemailer (`artifacts/api-server/src/lib/email.ts`).

**Configuration (env vars):**
- `SMTP_HOST` = smtp.mail.me.com
- `SMTP_PORT` = 587
- `SMTP_USER` = olastechng@icloud.com
- `SMTP_FROM_NAME` = PawGlobal
- `SMTP_FROM_EMAIL` = olastechng@icloud.com
- `SMTP_PASSWORD` = (stored as secret)

**Emails sent:**
- Order confirmation — sent after a successful Stripe checkout (purchase)
- Donation receipt — sent after a successful Stripe donation

Note: iCloud Mail requires an **app-specific password** (not your regular Apple ID password). Generate one at appleid.apple.com → Sign-In & Security → App-Specific Passwords.
