# 🚀 Complete Stripe-Supabase Setup Guide

## ⚠️ Issues Found
Your Stripe-Supabase integration isn't working because:
1. Missing environment variables 
2. Empty database tables (no products/customers/subscriptions)
3. Service role key not configured

## 🔧 Step-by-Step Fix

### 1. Get Supabase Service Role Key
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `lunra-ai`
3. Go to Settings → API
4. Copy the `service_role` key (starts with `eyJ...`)

### 2. Create `.env.local` file in project root:

```bash
# Supabase Configuration (✅ Already configured)
NEXT_PUBLIC_SUPABASE_URL=https://kwslahchhzvtrbqxdluw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3c2xhaGNoaHp2dHJicXhkbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5ODk1NTcsImV4cCI6MjA2NDU2NTU1N30._yuwQGfsEjmNn2yW1IDZwS1NCG7KKUKoem0N82X6FMk

# Supabase Service Role Key (❌ YOU NEED TO ADD THIS)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe Configuration (❌ YOU NEED TO ADD THESE)
STRIPE_SECRET_KEY=sk_test_... # Get from Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_... # Get from Stripe Webhooks
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Get from Stripe Dashboard

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Stripe Dashboard

#### Create Products & Prices:
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to Products
3. Create your subscription products (e.g., "Pro Plan", "Premium Plan")
4. Add recurring prices (monthly/yearly)

#### Set Up Webhook:
1. Go to Developers → Webhooks
2. Add endpoint: `http://localhost:3000/api/stripe/webhook` (for development)
3. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated` 
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret

### 4. Install Dependencies & Test

```bash
# Install dependencies
pnpm install

# Test Supabase connection
pnpm run test-supabase

# Sync Stripe products to Supabase
pnpm run sync-stripe

# Start development server
pnpm run dev
```

### 5. Test the Integration

1. **Sign up for account** → Should create Stripe customer
2. **Go to `/billing`** → Should show subscription options
3. **Subscribe with test card** → Use `4242424242424242`
4. **Check webhook logs** → Should sync subscription to Supabase

### 6. Verify Database

After successful setup, your tables should have data:

```sql
-- Check customers
SELECT COUNT(*) FROM customers;

-- Check products  
SELECT COUNT(*) FROM products;

-- Check subscriptions
SELECT COUNT(*) FROM subscriptions;
```

## 🔍 Debugging Commands

```bash
# Test Supabase connection
pnpm run test-supabase

# Sync products from Stripe
pnpm run sync-stripe

# Check webhook logs (in your app)
# Look at browser console or server logs
```

## 🚨 Common Issues

### "Stripe configuration missing"
- Check your `.env.local` file exists
- Verify `STRIPE_SECRET_KEY` is set
- Restart your dev server after adding env vars

### "Webhook signature verification failed" 
- Check `STRIPE_WEBHOOK_SECRET` matches your webhook endpoint
- Ensure webhook endpoint URL is correct
- Use ngrok for local testing: `ngrok http 3000`

### "Customer not found in database"
- User didn't complete signup flow
- Stripe customer creation failed
- Check `/api/create-stripe-customer` logs

### Products not showing
- Run `pnpm run sync-stripe` 
- Check Stripe dashboard has active products
- Verify products have active prices

## 📱 Next Steps After Setup

1. **Test complete flow** with test cards
2. **Set up production webhook** for live environment  
3. **Replace test keys** with live keys for production
4. **Add monitoring** for failed payments
5. **Customize billing UI** as needed

## 🔗 Useful Links

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Webhook Testing with ngrok](https://ngrok.com/) 
