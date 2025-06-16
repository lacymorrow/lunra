# Stripe Setup Without Webhooks

This guide shows how to set up Stripe payments without webhooks for immediate testing and development.

## Quick Setup

### 1. Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 2. Create Products in Stripe Dashboard

1. **Log into Stripe Dashboard** → <https://dashboard.stripe.com/>

2. **Create Bloom Plan Product:**
   - Go to **Products** → **Add Product**
   - Name: `Bloom Plan`
   - Description: `Unlimited goals and AI coaching`
   - **Add Price:**
     - Model: `Recurring`
     - Price: `$9.00 USD`
     - Billing period: `Monthly`
     - Copy the **Price ID** (starts with `price_...`)

3. **Update Price ID in Code:**

   ```typescript
   // In lib/stripe.ts
   export const PLANS = {
     seedling: {
       name: 'Seedling',
       price: 0,
       goalsLimit: 3,
       priceId: null, // Free plan
     },
     bloom: {
       name: 'Bloom',
       price: 9,
       goalsLimit: null, // Unlimited
       priceId: 'price_YOUR_ACTUAL_PRICE_ID_HERE', // Replace with your Price ID
     },
   }
   ```

### 3. Set Up Database

Run the subscription tables migration:

```bash
# Execute the SQL in your Supabase SQL editor
cat scripts/create-subscription-tables.sql
```

### 4. Test the Integration

1. **Start your development server:**

   ```bash
   pnpm dev
   ```

2. **Test payment flow:**
   - Go to your app's pricing page
   - Click "Upgrade to Bloom"
   - Use test card: `4242 4242 4242 4242`
   - Complete checkout
   - You'll be redirected back to dashboard with success message

3. **If something goes wrong:**
   - Check the dashboard for error messages
   - Use the "Sync Status" button on the billing page
   - Check browser console for errors

## How It Works (Without Webhooks)

### Payment Flow

1. User clicks "Upgrade to Bloom"
2. Creates Stripe Checkout Session
3. User completes payment on Stripe
4. Stripe redirects to `/api/stripe/checkout-success`
5. Server retrieves payment details from Stripe
6. Updates database with subscription info
7. Redirects to dashboard with success message

### Manual Sync

- Users can manually sync their subscription status
- Billing page has "Sync Status" button
- Fetches latest data from Stripe API
- Updates local database

## Advantages of This Approach

✅ **Quick setup** - No webhook configuration needed  
✅ **Immediate testing** - Works right away  
✅ **Reliable payment processing** - Uses Stripe's redirect flow  
✅ **Manual sync option** - Users can refresh their status  

## Limitations

⚠️ **No real-time updates** - Status changes aren't instant  
⚠️ **Manual intervention** - Some edge cases need manual sync  
⚠️ **Limited automation** - No automatic failed payment handling  

## Adding Webhooks Later

When you're ready for production, you can add webhooks:

1. Set up webhook endpoint in Stripe Dashboard
2. Add `STRIPE_WEBHOOK_SECRET` environment variable
3. The webhook handler at `/api/stripe/webhook` is already implemented
4. Remove the success redirect URL and use webhooks for all updates

## Test Cards

Use these for testing:

- **Success:** `4242 4242 4242 4242`
- **Declined:** `4000 0000 0000 0002`
- **Requires authentication:** `4000 0000 0000 3220`

Any future date for expiry, any CVC, any ZIP code.

## Troubleshooting

**Payment succeeded but subscription not showing?**

- Click "Sync Status" on billing page
- Check Stripe dashboard for the customer
- Verify the Price ID in your code matches Stripe

**Getting checkout errors?**

- Verify your Stripe publishable key is correct
- Check that Stripe script is loading (check browser console)
- Ensure you're using test mode keys for development

**Database errors?**

- Verify subscription tables were created correctly
- Check Supabase permissions and RLS policies
- Look at server logs for specific error messages

# 🚨 Missing Stripe Webhook Configuration

## Problem Detected

Your payment system is configured but the `STRIPE_WEBHOOK_SECRET` environment variable is missing. This means:

✅ **Payments work** - users can complete checkout  
❌ **Permissions don't update** - because webhooks can't process subscription events

## Quick Fix Options

### Option 1: Add Webhook Secret (Recommended for Production)

1. **Create webhook endpoint in Stripe Dashboard:**
   - Go to <https://dashboard.stripe.com/webhooks>
   - Click "Add endpoint"
   - Endpoint URL: `https://yourdomain.com/api/stripe/webhook` (or `http://localhost:3000/api/stripe/webhook` for dev)
   - Events to send:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`

2. **Copy the webhook secret:**
   - After creating the webhook, click on it
   - Reveal the webhook secret (starts with `whsec_...`)
   - Add to your `.env.local`:

   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

3. **Restart your development server**

### Option 2: Manual Sync (Temporary Workaround)

If users complete payments but don't get permissions:

1. Have them visit `/billing` page
2. Click "Sync Status" button  
3. This will manually sync their subscription

### Option 3: Disable Webhook Validation (NOT RECOMMENDED)

Only for development testing - never use in production.

## Testing After Fix

Run this to verify everything works:

```bash
curl "http://localhost:3000/api/dev/test-payment-flow" | jq .
```

Should show `"overallHealth": "healthy"`

## How to Test a Complete Payment Flow

1. Go to your app's pricing page
2. Click "Upgrade to Bloom"
3. Use test card: `4242 4242 4242 4242`
4. Complete payment
5. Check that user's plan is updated to "Bloom"
6. Verify they can create unlimited goals

The webhook processing ensures immediate permission updates after payment!
