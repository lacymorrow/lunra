# Lunra Documentation

## Overview

Lunra is a Next.js app with Supabase and Stripe. It provides offline-first goal management for all users and cloud sync for paid users. This document is the single source of truth for setup, operations, payments/webhooks, and troubleshooting.

## Quick Start

1. Install dependencies:
   
   ```bash
   pnpm install
   ```

2. Create environment file:
   
   ```bash
   cp env.example .env.local
   ```

3. Fill required variables (see Environment): restart dev server after edits.

4. Run locally:
   
   ```bash
   pnpm dev
   ```

## Environment

Add the following to `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_BLOOM_PRICE_ID=

# Webhooks (choose per environment; configure at least one for production)
STRIPE_WEBHOOK_SECRET_THIN=
STRIPE_WEBHOOK_SECRET_SNAP=
# Optional legacy endpoint
STRIPE_WEBHOOK_SECRET=
```

Notes:
- Never commit secrets. Manage production values in your host (e.g., Vercel) env settings.
- Replace any test keys with live keys for production.

## Database Setup

Apply schema in your Supabase SQL editor in this order:

1. `scripts/01-create-goals-schema.sql`
2. `scripts/02-setup-rls-policies.sql`
3. `scripts/03-create-helper-functions.sql`
4. `scripts/create-subscription-tables.sql`
5. Optional seed: `scripts/04-seed-sample-data.sql`

Tables use RLS; users can only access their own data.

## Payments and Webhooks

### Product and Price

1. In Stripe Dashboard, create a product for the Bloom plan with a monthly recurring price (e.g., $9 USD).
2. Copy the Price ID and set `STRIPE_BLOOM_PRICE_ID`.

### Webhook Endpoints

The app includes three endpoints; configure at least one:

- Staging: `POST /api/webhooks/stripe/snapshot` → `STRIPE_WEBHOOK_SECRET_SNAP`
- Production: `POST /api/webhooks/stripe/thin` → `STRIPE_WEBHOOK_SECRET_THIN`
- Legacy (optional): `POST /api/stripe/webhook` → `STRIPE_WEBHOOK_SECRET`

Recommended:
- Use `snapshot` for staging and `thin` for production.
- Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.

### Local Testing

Option A: Stripe CLI

```bash
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe/snapshot
```

Option B: ngrok

```bash
ngrok http 3000
# Use the ngrok URL as your webhook endpoint while testing
```

### Health and Diagnostics

```bash
curl "http://localhost:3000/api/dev/test-payment-flow" | jq .
```

Expected for production: `overallHealth` should be `"healthy"` with a configured webhook secret.

## Operations

### Reset Database (development only)

```bash
npm run db:reset
```

Or via API:

```bash
curl -X POST http://localhost:3000/api/dev/reset-database \
  -H "Content-Type: application/json" \
  -d '{"confirm":"RESET_DATABASE"}'
```

### Useful Endpoints

- `POST /api/stripe/create-checkout-session`
- `GET  /api/stripe/checkout-success`
- `POST /api/stripe/create-portal-session`
- `POST /api/stripe/sync-subscription`
- `POST /api/webhooks/stripe/snapshot`
- `POST /api/webhooks/stripe/thin`
- Dev: `GET /api/dev/test-payment-flow`, `GET /api/dev/check-stripe-config`

## Architecture Overview

- Next.js App Router, Supabase (Postgres) for auth/data, Stripe for payments.
- Dual-storage model for goals:
  - Guests/Free: localStorage only (offline-first)
  - Paid (Bloom): localStorage + database with background bidirectional sync
- Local is always the source of truth on conflict; sync is non-blocking.

Key files:
- Payments: `app/api/stripe/*`, `app/api/webhooks/stripe/*`, `lib/services/subscriptions.ts`, `lib/stripe.ts`, `lib/stripe-config.ts`
- Goals: `lib/data-manager.ts`, `lib/services/goals.ts`, `contexts/goal-data-context.tsx`
- Auth: `contexts/auth-context.tsx`, `lib/supabase-server.ts`

## Troubleshooting

### Payment succeeded but no access
- Ensure a webhook endpoint is configured and the secret matches.
- Check `GET /api/dev/test-payment-flow` for `criticalIssues`.
- Use `POST /api/stripe/sync-subscription` as fallback.

### Webhook signature errors
- Verify the correct secret is set for the specific endpoint.
- Recreate the endpoint in Stripe Dashboard and update the secret.

### Database errors
- Confirm all SQL scripts ran and RLS is enabled.
- Verify Supabase URL and keys are correct.

## Production Checklist

- Environment variables set (live Stripe keys in production)
- Bloom price configured and `STRIPE_BLOOM_PRICE_ID` set
- Webhook endpoint(s) configured and secrets added
- Database schema applied and policies verified
- Diagnostic endpoints show healthy


