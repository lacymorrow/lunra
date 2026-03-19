# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lunra is an AI-powered goal planning app with offline-first architecture and subscription-based cloud sync. Free users (Seedling plan) get 3 goals stored in localStorage; paid users (Bloom plan, $9/mo via Stripe) get unlimited goals with bidirectional cloud sync to Supabase.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server on :3000 |
| `pnpm build` | Production build (strict — fails on ESLint/TS errors) |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run Vitest (single run) |
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm db:reset` | Reset development database |

Stripe local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe/snapshot`

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript 5
- **Database:** Supabase (PostgreSQL) with Row-Level Security
- **Auth:** Supabase Auth (email/password)
- **Payments:** Stripe (subscriptions)
- **AI:** Vercel AI SDK (OpenAI, Gemini, Anthropic)
- **Styling:** TailwindCSS, Radix UI components
- **Testing:** Vitest, React Testing Library

## Architecture

### Dual-Storage Sync Engine

The core innovation is in `lib/data-manager.ts` (GoalDataManager singleton):

- **localStorage is always primary** — immediate offline access, wins conflicts
- **Supabase DB is secondary** — async background sync for paid users only (30-second interval)
- Goals are linked between stores via a `dbId` field (UUID)
- Initial migration uses signature matching (title+description) for deduplication
- All CRUD: localStorage first, then background DB write via mutex guard

### Provider Hierarchy

```
RootLayout (server component)
  └─ ClientLayout (client)
       ├─ AuthProvider (contexts/auth-context.tsx)
       │  └─ GoalDataProvider (contexts/goal-data-context.tsx)
       └─ Toaster
```

### Type System

Two parallel type formats with converters in `types/database.ts`:
- `SavedGoal` — localStorage format (numeric IDs, camelCase)
- `DatabaseGoal[WithMilestones]` — Supabase format (UUIDs, snake_case)
- Converters: `convertLocalStorageToDatabase()` / `convertDatabaseToLocalStorage()`

### API Routes

- `/api/stripe/*` — Checkout session creation, portal, subscription sync
- `/api/webhooks/stripe/snapshot` (staging) and `/thin` (production) — Webhook handlers
- `/api/goal-breakdown/` — AI goal breakdown
- `/api/check-in-coach/` — AI check-in coaching
- `/api/dev/*` — Dev-only utilities (test payment flow, check config, reset DB)

### Stripe Webhook Events

Handled in webhook routes: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

**Important (Stripe SDK v20+):** `current_period_start/end` live on `subscription.items.data[0]`, not directly on the subscription object.

### Database Schema

SQL migrations in `scripts/`:
- `goals` — user goals with progress tracking, sub_goals JSONB
- `milestones` — weekly tasks linked to goals
- `user_profiles` — plan info, stripe_customer_id (auto-created on signup via trigger)
- `subscriptions` — Stripe subscription state mirror

All tables use RLS — users can only access their own data.

### Subscription Feature Gating

`lib/subscription-limits.ts` controls plan limits. `lib/stripe-config.ts` defines plan details. The `STRIPE_BLOOM_PRICE_ID` env var must match a manually-created Stripe product.

## Environment Variables

See `.env.example`. Required: Supabase URL/keys, Stripe keys, at least one webhook secret (`STRIPE_WEBHOOK_SECRET_SNAP` or `STRIPE_WEBHOOK_SECRET_THIN`). AI API keys are optional.
