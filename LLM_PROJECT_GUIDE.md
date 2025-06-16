# 🤖 LLM Project Guide - Lunra AI Goal Setting App

## 📋 Project Overview

**Lunra** is a Next.js-based AI goal-setting application with Stripe payment integration and Supabase backend. Users can create goals with AI assistance, track progress through milestones, and upgrade to premium plans for unlimited goals.

### Technology Stack

- **Frontend/Backend:** Next.js 15.2.4 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Payments:** Stripe
- **Authentication:** Supabase Auth
- **Styling:** Tailwind CSS
- **Package Manager:** pnpm
- **Deployment:** Vercel (inferred)

## 🏗️ System Architecture

### Core Components

\`\`\`
┌─ Authentication (Supabase Auth)
├─ User Management (user_profiles table)
├─ Payment Processing (Stripe + webhooks)
├─ Goal Management (goals + milestones tables)
├─ AI Integration (goal breakdown/coaching)
└─ Subscription Management (plans + limits)
\`\`\`

### Database Schema

#### Core Tables

1. **`user_profiles`** - User plan and limit management
2. **`subscriptions`** - Stripe subscription tracking
3. **`goals`** - User goal storage
4. **`milestones`** - Goal milestone tracking

#### Key Relationships

- Users have profiles (1:1)
- Users have subscriptions (1:1, optional)
- Users have goals (1:many)
- Goals have milestones (1:many)

## 💳 Payment System Architecture

### Plans Configuration

\`\`\`typescript
// Located in: lib/stripe-config.ts
PLANS = {
  seedling: { price: 0, goalsLimit: 3 },    // Free plan
  bloom: { price: 9, goalsLimit: -1 }       // Premium plan (unlimited)
}
\`\`\`

### Webhook Endpoints (Production)

1. **Snapshot:** `https://lunra.ai/api/webhooks/stripe/snapshot`
2. **Thin:** `https://lunra.ai/api/webhooks/stripe/thin`
3. **Original:** `https://lunra.ai/api/stripe/webhook` (legacy)

### Payment Flow

\`\`\`
User Payment → Stripe Checkout → Webhook Event → Database Update → User Permissions
\`\`\`

## 🔧 Environment Variables

### Required Variables

\`\`\`bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_BLOOM_PRICE_ID=price_...

# Webhooks (at least one required)
STRIPE_WEBHOOK_SECRET_SNAP=whsec_dECYZWpiAj5wXSXOxLkMxpV06qgQneDK
STRIPE_WEBHOOK_SECRET_THIN=whsec_Qt7qb9KUafz7z3jG29YregGfi3LocZwv
STRIPE_WEBHOOK_SECRET=whsec_... (optional legacy)
\`\`\`

## 📁 File Organization

### Key Directories

\`\`\`
app/
├── api/
│   ├── stripe/                 # Stripe payment endpoints
│   ├── webhooks/stripe/        # New webhook endpoints
│   └── dev/                    # Development/testing tools
├── auth/                       # Authentication pages
├── billing/                    # Subscription management UI
├── dashboard/                  # Main app interface
└── [other pages]/

lib/
├── services/                   # Database service functions
├── stripe.ts                   # Server-side Stripe config
├── stripe-config.ts           # Client-safe Stripe config
└── supabase-server.ts         # Server Supabase client

contexts/
└── auth-context.tsx           # User authentication state

types/
└── database.ts                # TypeScript type definitions
\`\`\`

### Critical Files for LLMs to Understand

#### Payment Processing

- `app/api/webhooks/stripe/*/route.ts` - Webhook handlers
- `app/api/stripe/*/route.ts` - Payment API endpoints
- `lib/services/subscriptions.ts` - Subscription database operations
- `lib/stripe.ts` - Server Stripe configuration

#### User Management

- `contexts/auth-context.tsx` - User state management
- `lib/services/subscriptions-client.ts` - Client-side user operations
- `app/billing/page.tsx` - Subscription management UI

#### Goal Management

- `lib/services/goals.ts` - Goal database operations
- `lib/subscription-limits.ts` - Plan limit enforcement
- `lib/data-manager.ts` - Unified data management

## 🔒 Security & Access Control

### Row Level Security (RLS)

- All tables have RLS enabled
- Users can only access their own data
- Policies enforce user isolation

### Authentication Flow

\`\`\`
User Sign Up → Profile Creation → Plan Assignment → Goal Access
\`\`\`

### Permission Checks

- Goal creation checks plan limits
- Subscription status validates access
- RLS policies enforce data isolation

## 🧪 Testing & Diagnostics

### Development Tools

\`\`\`bash
# System health check
curl "http://localhost:3000/api/dev/test-payment-flow" | jq .

# Stripe configuration check
curl "http://localhost:3000/api/dev/check-stripe-config" | jq .

# Manual subscription sync
curl -X POST "http://localhost:3000/api/stripe/sync-subscription"
\`\`\`

### Expected Responses

- **Healthy system:** `"overallHealth": "healthy"`
- **Missing webhooks:** `"overallHealth": "critical"`
- **Configuration issues:** Check `criticalIssues` array

## 🚨 Common Issues & Solutions

### Payment Issues

1. **Payments succeed but permissions don't update**
   - **Cause:** Missing webhook configuration
   - **Solution:** Add webhook secrets to environment
   - **Test:** Run diagnostic endpoint

2. **Webhook signature verification fails**
   - **Cause:** Incorrect webhook secret
   - **Solution:** Verify secret in Stripe Dashboard
   - **Check:** Look for `Invalid signature` in logs

3. **User stuck on free plan after payment**
   - **Cause:** Webhook processing failed
   - **Solution:** Use manual sync button on billing page
   - **API:** `/api/stripe/sync-subscription`

### Database Issues

1. **Profile not created for new user**
   - **Cause:** Trigger function issue
   - **Check:** `create_profile_for_new_user()` function
   - **Solution:** Manually create via `createUserProfile()`

2. **Goal limits not enforced**
   - **Cause:** Plan configuration mismatch
   - **Check:** `lib/subscription-limits.ts`
   - **Verify:** User profile `goals_limit` field

## 📊 Data Flow Patterns

### User Registration

\`\`\`
Auth Sign Up → Trigger → Profile Creation → Plan Assignment (Seedling)
\`\`\`

### Payment Processing

\`\`\`
Checkout → Stripe → Webhook → Subscription Creation → Profile Update → Permissions
\`\`\`

### Goal Creation

\`\`\`
User Request → Plan Check → Limit Validation → Database Insert → Response
\`\`\`

## 🔄 State Management

### Authentication State

- **Context:** `auth-context.tsx`
- **Includes:** User, profile, subscription data
- **Refresh:** `refreshProfile()` function

### Data Synchronization

- Client-side caching with server sync
- Automatic profile refresh on auth changes
- Manual sync available for subscriptions

## 🎯 Business Logic Rules

### Plan Limitations

- **Seedling (Free):** 3 goals maximum
- **Bloom (Premium):** Unlimited goals (-1 = infinite)
- **Enforcement:** Client + server validation

### Subscription States

- **Active:** Full access to plan features
- **Past Due:** Limited access, payment retry
- **Canceled:** Downgrade to free plan
- **Incomplete:** Payment processing

### Goal Management

- Goals tied to user_id via RLS
- Milestones auto-update goal progress
- Triggers maintain data consistency

## 🛠️ Development Workflow

### Adding New Features

1. **Check authentication requirements**
2. **Verify plan limitations impact**
3. **Update RLS policies if needed**
4. **Test with different plan types**
5. **Update diagnostic tools**

### Modifying Payment Flow

1. **Test in Stripe test mode**
2. **Verify webhook processing**
3. **Check subscription state transitions**
4. **Update documentation**
5. **Test edge cases (failures, retries)**

### Database Changes

1. **Update type definitions**
2. **Modify service functions**
3. **Update RLS policies**
4. **Test data migration**
5. **Verify client compatibility**

## 📝 Code Conventions

### TypeScript Types

- Database types in `types/database.ts`
- Consistent naming: `Database*` prefix
- Export interfaces for reuse

### API Routes

- Consistent error handling
- Detailed logging with prefixes
- Proper HTTP status codes
- JSON responses with error/success states

### Service Functions

- Server services in `lib/services/`
- Client services in `lib/services/*-client.ts`
- Consistent error handling patterns
- Null returns for not found

### Logging Patterns

\`\`\`typescript
console.log('✅ [component] Success message')
console.error('❌ [component] Error message')
console.warn('⚠️ [component] Warning message')
console.log('🔍 [component] Debug info')
\`\`\`

## 🔍 Debugging Strategies

### Payment Issues

1. Check Stripe Dashboard webhook logs
2. Verify environment variables
3. Test webhook endpoints manually
4. Check database subscription records

### Authentication Issues

1. Verify Supabase configuration
2. Check RLS policies
3. Test auth context refresh
4. Validate JWT tokens

### Database Issues

1. Check trigger functions
2. Verify RLS policies
3. Test service functions
4. Monitor SQL queries

## 📚 Key Dependencies

### Core Libraries

- `@supabase/supabase-js` - Database client
- `stripe` - Payment processing
- `@stripe/stripe-js` - Client-side Stripe
- `next` - Framework
- `tailwindcss` - Styling

### Custom Utilities

- Authentication wrappers
- Type-safe database functions
- Plan limit enforcement
- Data synchronization

## 🎯 Success Metrics

### System Health Indicators

- Diagnostic endpoint returns "healthy"
- Webhook events process successfully
- Payment completion updates permissions
- Users can create goals within limits

### Key User Flows

1. **Sign up → Create goal → Success**
2. **Upgrade → Payment → Unlimited access**
3. **Cancel → Downgrade → Limited access**
4. **Billing sync → Status update → Correct permissions**

## 🚀 Deployment Considerations

### Environment Setup

- Set all required environment variables
- Configure webhook endpoints in Stripe
- Verify database migrations applied
- Test authentication flows

### Monitoring

- Watch webhook delivery success rates
- Monitor payment completion rates
- Track user subscription states
- Alert on critical errors

---

## 🎯 Quick Start for New LLMs

1. **Run diagnostics:** `curl "http://localhost:3000/api/dev/test-payment-flow" | jq .`
2. **Check health:** Should show `"overallHealth": "healthy"`
3. **Review recent logs:** Look for webhook processing
4. **Test payment flow:** Use test card `4242 4242 4242 4242`
5. **Verify permissions:** Check user plan after payment

This system is production-ready with robust error handling, comprehensive logging, and multiple fallback mechanisms. The payment flow is the critical path - ensure webhooks are configured and processing correctly.

**Remember:** Users expect immediate access after payment. The webhook processing must be reliable! 💳✨
