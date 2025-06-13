# 🚀 Stripe Payment Integration Setup Guide

This guide will help you complete the Stripe payment integration for your Lunra AI goal-setting application.

## 📋 Prerequisites

- ✅ Supabase project with authentication set up
- ✅ Next.js application running
- ✅ Stripe account (test mode is fine for development)

## 🔧 Step 1: Stripe Dashboard Setup

### Create Products and Prices

1. **Log into Stripe Dashboard** → <https://dashboard.stripe.com/>

2. **Create Bloom Plan Product:**
   - Go to **Products** → **Add Product**
   - Name: `Bloom Plan`
   - Description: `Advanced AI mentorship with unlimited goals`
   - Upload product image (optional)

3. **Add Recurring Price:**
   - Price: `$9.00`
   - Billing period: `Monthly`
   - Currency: `USD`
   - **Copy the Price ID** (starts with `price_...`) - you'll need this!

### Set Up Webhook Endpoint

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL:** `https://yourdomain.com/api/stripe/webhook`
4. **Listen to:** Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. **Copy the Webhook Secret** (starts with `whsec_...`)

## 🌍 Step 2: Environment Variables

Create a `.env.local` file in your project root with these variables:

```bash
# Existing Supabase vars (keep these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# New Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_BLOOM_PRICE_ID=price_your_bloom_plan_price_id_here
```

**Where to find these:**

- **Secret Key:** Stripe Dashboard → Developers → API Keys → Secret key
- **Publishable Key:** Stripe Dashboard → Developers → API Keys → Publishable key  
- **Webhook Secret:** From the webhook endpoint you created above
- **Price ID:** From the Bloom plan product you created above

## 🗄️ Step 3: Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- Run the entire content of scripts/create-subscription-tables.sql
```

Copy and paste the entire content from `scripts/create-subscription-tables.sql` into your Supabase SQL Editor and execute it.

This creates:

- `user_profiles` table for user plan management
- `subscriptions` table for Stripe subscription tracking
- Row Level Security policies
- Automatic profile creation triggers
- Helper functions

## 🧪 Step 4: Testing the Integration

### Test the Free Plan (Seedling)

1. Go to your landing page
2. Click "Begin Growing" (Seedling plan)
3. Should redirect to signup/dashboard

### Test the Paid Plan (Bloom)

1. Go to your landing page  
2. Click "Start Blooming" (Bloom plan)
3. Should open Stripe Checkout
4. Use test card: `4242 4242 4242 4242`
5. Any future date for expiry
6. Any 3-digit CVC

### Test Subscription Management

1. After successful payment, go to `/billing`
2. Click "Manage Billing"
3. Should open Stripe Customer Portal

## 🔄 Step 5: Webhook Testing

### Using Stripe CLI (Recommended)

1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
2. Login: `stripe login`
3. Forward events: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Test a payment flow

### Using ngrok (Alternative)

1. Install ngrok: `brew install ngrok`
2. Expose local server: `ngrok http 3000`
3. Update webhook URL in Stripe Dashboard to your ngrok URL
4. Test payment flow

## 🚀 Step 6: Production Deployment

### Environment Variables

Update your production environment (Vercel/Netlify) with:

- All the same environment variables
- Replace `sk_test_` with `sk_live_` keys
- Replace `pk_test_` with `pk_live_` keys
- Update webhook URL to production domain

### Stripe Live Mode

1. Switch to Live mode in Stripe Dashboard
2. Create products/prices again in Live mode
3. Update environment variables with live keys
4. Set up production webhook endpoint

## 🔧 Key Features Implemented

### ✅ **Subscription Management**

- Automatic user profile creation
- Plan limits enforcement (3 goals for Seedling, unlimited for Bloom)
- Subscription status tracking

### ✅ **Payment Flow**

- Stripe Checkout integration
- Webhook handling for subscription events
- Customer portal for billing management

### ✅ **UI Components**

- Billing page with plan management
- Pricing buttons with authentication flow
- Subscription status displays

### ✅ **Security**

- Row Level Security on all tables
- Webhook signature verification  
- User isolation and authorization

## 🛟 Troubleshooting

### Common Issues

**❌ "Stripe is not defined" error**

- Make sure Stripe script is loaded in `app/layout.tsx`
- Check browser console for script loading errors

**❌ Webhook events not received**

- Verify webhook URL is accessible
- Check webhook signature in Stripe Dashboard
- Ensure `STRIPE_WEBHOOK_SECRET` is correct

**❌ Database errors**

- Verify all SQL migrations ran successfully
- Check RLS policies are enabled
- Ensure triggers are working

**❌ Environment variables**

- Double-check all environment variables are set
- Restart your development server after changes
- Verify no trailing spaces in env values

### Testing Webhooks Locally

If webhooks aren't working:

1. **Check logs:** Look at your Next.js console and Stripe webhook logs
2. **Verify signature:** The webhook secret must match exactly
3. **Test endpoint:** Use `curl` or Postman to test the webhook endpoint manually

```bash
# Test webhook endpoint is accessible
curl -X POST http://localhost:3000/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## 📈 Next Steps

### Goal Limit Enforcement

The system now automatically:

- Tracks user plan limits
- Prevents goal creation when limit reached
- Shows upgrade prompts for free users

### Additional Features You Can Add

- Annual billing discounts
- Multiple plan tiers
- Usage-based billing
- Team/organization plans

## 💬 Need Help?

If you encounter issues:

1. Check browser console for JavaScript errors
2. Check Next.js server logs for API errors
3. Check Stripe Dashboard webhook logs
4. Verify all environment variables are set correctly

The integration is now complete and production-ready! 🎉
