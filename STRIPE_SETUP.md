# Stripe Integration Setup Guide

## Required Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key (test or live)
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook endpoint secret from Stripe dashboard
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key

# Supabase Configuration (if not already set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000 # Your app URL (production URL for live)
```

## Stripe Dashboard Setup

### 1. Create Products and Prices
1. Go to Stripe Dashboard > Products
2. Create your subscription products
3. Add recurring prices (monthly/yearly)
4. Note down the Price IDs for testing

### 2. Configure Webhooks
1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 3. Test Mode vs Live Mode
- Use test keys (`sk_test_...`, `pk_test_...`) for development
- Switch to live keys for production
- Test with Stripe's test card numbers

## Database Setup

Run the Stripe schema migration:

```sql
-- This should already be in your scripts/05-create-stripe-schema.sql
-- Run it in your Supabase SQL editor if not already done
```

## Testing the Integration

### Test Cards (Test Mode Only)
- Success: `4242424242424242`
- Decline: `4000000000000002`
- Requires 3D Secure: `4000002500003155`

### Test Flow
1. Sign up for an account
2. Go to `/billing`
3. Select a subscription plan
4. Complete checkout with test card
5. Verify subscription appears in dashboard
6. Test cancellation/reactivation

## Production Checklist

- [ ] Replace test keys with live keys
- [ ] Update webhook endpoint to production URL
- [ ] Test webhook delivery in Stripe dashboard
- [ ] Verify SSL certificate on webhook endpoint
- [ ] Test complete subscription flow
- [ ] Set up monitoring for failed payments
- [ ] Configure email notifications in Stripe

## Troubleshooting

### Common Issues

1. **Webhook signature verification failed**
   - Check `STRIPE_WEBHOOK_SECRET` is correct
   - Ensure webhook endpoint is accessible
   - Verify SSL certificate

2. **Customer not found in database**
   - Check if Stripe customer creation succeeded during signup
   - Verify `customers` table has proper data

3. **Subscription not syncing**
   - Check webhook events are being received
   - Look for errors in webhook handler logs
   - Verify database permissions

### Debug Mode
Add logging to webhook handler for debugging:

```typescript
console.log('Webhook event:', event.type, event.id)
```

## Security Notes

- Never expose secret keys in client-side code
- Use environment variables for all sensitive data
- Validate webhook signatures to prevent tampering
- Implement proper error handling and logging
- Use HTTPS in production for webhook endpoints 
