# 🔗 Webhook Endpoints Configuration

## Available Webhook Endpoints

Your Lunra application now supports multiple webhook endpoints for different environments or purposes:

### 1. Original Endpoint

\`\`\`
https://lunra.ai/api/stripe/webhook
\`\`\`

- **Environment Variable:** `STRIPE_WEBHOOK_SECRET`
- **Purpose:** Main webhook endpoint
- **Status:** ⚠️ Optional (if using new endpoints)

### 2. Snapshot Endpoint

\`\`\`
https://lunra.ai/api/webhooks/stripe/snapshot
\`\`\`

- **Environment Variable:** `STRIPE_WEBHOOK_SECRET_SNAP`
- **Secret:** `whsec_dECYZWpiAj5wXSXOxLkMxpV06qgQneDK`
- **Purpose:** Snapshot/staging environment webhooks
- **Status:** ✅ Ready to use

### 3. Thin Endpoint

\`\`\`
https://lunra.ai/api/webhooks/stripe/thin
\`\`\`

- **Environment Variable:** `STRIPE_WEBHOOK_SECRET_THIN`
- **Secret:** `whsec_Qt7qb9KUafz7z3jG29YregGfi3LocZwv`
- **Purpose:** Thin/production environment webhooks  
- **Status:** ✅ Ready to use

## Environment Variables Setup

Add these to your `.env.local` file:

\`\`\`bash
# New webhook secrets (provided)
STRIPE_WEBHOOK_SECRET_SNAP=whsec_dECYZWpiAj5wXSXOxLkMxpV06qgQneDK
STRIPE_WEBHOOK_SECRET_THIN=whsec_Qt7qb9KUafz7z3jG29YregGfi3LocZwv

# Optional: Keep original if needed
STRIPE_WEBHOOK_SECRET=whsec_your_original_secret_here
\`\`\`

## Stripe Dashboard Configuration

For each endpoint, configure in your Stripe Dashboard:

1. **Go to:** <https://dashboard.stripe.com/webhooks>
2. **Add endpoint** for each URL above
3. **Events to select:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

## Testing Webhooks

Test each endpoint individually:

\`\`\`bash
# Test snapshot endpoint
curl -X POST https://lunra.ai/api/webhooks/stripe/snapshot \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Test thin endpoint  
curl -X POST https://lunra.ai/api/webhooks/stripe/thin \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
\`\`\`

## Webhook Processing Flow

All endpoints handle the same events:

1. **Payment Completed** → Creates subscription & updates user plan
2. **Subscription Updated** → Updates subscription status & user permissions
3. **Subscription Canceled** → Downgrades user to free plan
4. **Payment Failed** → Marks subscription as past due

## Monitoring & Logs

Each endpoint has distinct logging prefixes:

- `📸 [webhook-snapshot]` - Snapshot endpoint logs
- `🎯 [webhook-thin]` - Thin endpoint logs
- `🔧 [webhook]` - Original endpoint logs

## Best Practices

### Environment Separation

- **Development:** Use snapshot endpoint
- **Production:** Use thin endpoint
- **Testing:** Use original endpoint

### Security

- Each endpoint validates its own webhook secret
- Failed signature verification returns 400 error
- All events are logged with endpoint identification

### Failover

If one endpoint fails, Stripe will retry. You can also:

1. Configure multiple endpoints in Stripe for redundancy
2. Use different endpoints for different event types
3. Monitor logs to ensure events are processed

## Verification

Run the diagnostic tool to verify all endpoints:

\`\`\`bash
curl "https://lunra.ai/api/dev/test-payment-flow" | jq .
\`\`\`

Should show all webhook secrets as configured and endpoints as available.

## Next Steps

1. **Add environment variables** to your deployment
2. **Configure Stripe webhooks** for your production URLs
3. **Test payment flow** end-to-end
4. **Monitor webhook delivery** in Stripe Dashboard

Your payment system now has robust webhook handling with multiple endpoint support! 🎉
