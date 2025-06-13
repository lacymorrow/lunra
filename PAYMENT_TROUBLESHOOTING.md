# 💳 Payment Flow Troubleshooting Guide

## 🔍 Quick Diagnosis

Run this command to check your payment system health:

```bash
curl "http://localhost:3000/api/dev/test-payment-flow" | jq .
```

## 🚨 Critical Issue Identified

Your payment system has **one critical issue**:

### ❌ Missing `STRIPE_WEBHOOK_SECRET`

**What this means:**

- ✅ Payments complete successfully in Stripe
- ❌ User permissions don't get updated automatically
- ❌ Users stay on "Seedling" plan even after paying for "Bloom"

**Why this happens:**

- Stripe sends webhook events after successful payments
- Your app needs the webhook secret to verify these events
- Without verification, webhook events are rejected
- No permission updates occur

## ✅ Solutions

### Option 1: Add Webhook Secret (Recommended)

1. **Go to Stripe Dashboard:**

   ```
   https://dashboard.stripe.com/webhooks
   ```

2. **Create new webhook endpoint:**
   - URL: `http://localhost:3000/api/stripe/webhook` (dev) or `https://yourdomain.com/api/stripe/webhook` (prod)
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

3. **Copy webhook secret and add to `.env.local`:**

   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

4. **Restart your development server**

### Option 2: Manual Sync (Temporary Workaround)

For users who already paid but don't have permissions:

1. Have them visit `/billing` page
2. Click "Sync Status" button
3. This manually syncs their subscription from Stripe

### Option 3: Test Without Webhooks (Development Only)

For testing checkout flow without webhook setup:

```bash
curl -X POST "http://localhost:3000/api/dev/fix-webhook-validation"
```

⚠️ **WARNING:** This bypasses security. Only for development testing.

## 🧪 Testing Your Fix

After adding the webhook secret:

1. **Verify configuration:**

   ```bash
   curl "http://localhost:3000/api/dev/test-payment-flow" | jq .
   ```

   Should show `"overallHealth": "healthy"`

2. **Test complete payment flow:**
   - Go to your pricing page
   - Click "Upgrade to Bloom"
   - Use test card: `4242 4242 4242 4242`
   - Complete checkout
   - Verify user is upgraded to Bloom plan

3. **Check database:**
   - User should have `plan_id: "bloom"`
   - User should have `goals_limit: -1` (unlimited)

## 📊 Current System Status

✅ **Working correctly:**

- Stripe connection and API keys
- Price configuration ($9/month for Bloom)
- Database schema and user profiles
- Payment processing
- Subscription sync endpoint

❌ **Needs fixing:**

- Webhook signature verification
- Automatic permission updates after payment

## 🔧 System Architecture

Your payment flow works like this:

1. **User clicks "Upgrade"** → Creates Stripe checkout session
2. **User pays** → Stripe processes payment successfully  
3. **Stripe sends webhook** → `checkout.session.completed` event
4. **Your app processes webhook** → Updates user plan and permissions
5. **User gets access** → Can create unlimited goals

**The problem is step 4** - webhook processing fails due to missing secret.

## 📝 Environment Variables Checklist

Make sure you have all these in `.env.local`:

```bash
# Supabase (✅ You have these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key  
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Stripe (✅ You have most of these)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_BLOOM_PRICE_ID=price_1RYJSaFLciJzY1p7hP3mJaXS

# Missing this one ❌
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🎯 Next Steps

1. **Immediate fix:** Add `STRIPE_WEBHOOK_SECRET` to your environment
2. **Test the fix:** Run the diagnostic command
3. **Test complete flow:** Try a payment with test card
4. **Monitor logs:** Watch for successful webhook processing

Your payment system is 95% working - just needs that webhook secret! 🎉
