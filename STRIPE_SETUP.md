# 🚀 Stripe Payment Integration Setup Guide

This guide will walk you through setting up Stripe payments for your Lunra AI goal planning application.

## 📋 Overview

The integration includes:
- ✅ **Three subscription tiers**: Seedling (Free), Bloom ($9/month), Garden ($19/month)
- ✅ **Usage tracking**: Goal limits and AI request limits
- ✅ **Secure payments**: Stripe Checkout integration
- ✅ **Webhook handling**: Automatic subscription management
- ✅ **Database schema**: Complete subscription and usage tracking

## 🛠️ Prerequisites

- [x] Supabase project set up with authentication working
- [x] Stripe account created
- [x] Node.js and npm/pnpm installed
- [x] Next.js application running

## 📦 1. Dependencies Installed

The following packages have been added to your project:
```bash
npm install stripe @stripe/stripe-js --legacy-peer-deps
```

## 🗄️ 2. Database Setup

### Run the SQL Schema

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `/database/schema.sql`
4. Execute the SQL to create the necessary tables and functions

The schema creates:
- `subscriptions` table for tracking user subscriptions
- `usage_metrics` table for tracking goals and AI request usage
- Row Level Security (RLS) policies
- Automatic triggers for new user initialization

## 🔐 3. Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (create these in Stripe Dashboard)
STRIPE_BLOOM_PRICE_ID=price_...
STRIPE_GARDEN_PRICE_ID=price_...

# Existing Supabase variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 💳 4. Stripe Dashboard Setup

### Create Products and Prices

1. **Log in to Stripe Dashboard**
2. **Create Products**:
   - **Bloom Plan**: $9.00 USD monthly recurring
   - **Garden Plan**: $19.00 USD monthly recurring

3. **Copy Price IDs**:
   - Find the price IDs (starting with `price_`) and add them to your `.env.local`

### Set Up Webhook Endpoint

1. **Go to Webhooks** in Stripe Dashboard
2. **Add endpoint**: `https://yourdomain.com/api/stripe-webhook`
3. **Select events**:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

4. **Copy the webhook secret** and add it to your environment variables

## 🚀 5. Testing the Integration

### Test the Subscription Flow

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Create a test user**:
   - Sign up with a test email
   - Verify the user is created in Supabase auth.users table
   - Check that subscription and usage_metrics records are auto-created

3. **Test subscription upgrade**:
   - Navigate to `/subscription`
   - Click "Upgrade to Bloom" or "Upgrade to Garden"
   - Use Stripe test card numbers:
     - Success: `4242 4242 4242 4242`
     - Decline: `4000 0000 0000 0002`

4. **Verify webhook handling**:
   - Check Stripe webhook logs
   - Verify subscription status updates in database

### Test Goal Limits

1. **Free plan**: Try creating more than 3 goals
2. **Paid plans**: Verify unlimited goal creation
3. **AI limits**: Check monthly request tracking

## 📱 6. Features Implemented

### Subscription Management
- **Plan comparison**: Beautiful pricing cards with feature lists
- **Usage tracking**: Real-time progress bars for goals and AI requests
- **Billing information**: Current plan status and next billing date
- **Upgrade flow**: Seamless Stripe Checkout integration

### Usage Enforcement
- **Goal creation limits**: Automatically enforced based on subscription
- **AI request limits**: Monthly tracking with automatic resets
- **Graceful fallbacks**: Clear error messages and upgrade prompts

### Security
- **Row Level Security**: Database-level user isolation
- **Authentication**: Supabase auth integration
- **Webhook verification**: Stripe signature validation

## 🎨 7. UI Components Added

### New Pages
- `/subscription` - Subscription management page

### New Components
- `SubscriptionManager` - Main subscription interface
- `SubscriptionProvider` - React context for subscription state

### Navigation Updates
- Added "Subscription & Billing" to user dropdown menu
- Integrated subscription status throughout the app

## 🔄 8. Webhook Events Handled

| Event | Description | Action |
|-------|-------------|--------|
| `checkout.session.completed` | Payment successful | Activate subscription, update limits |
| `customer.subscription.updated` | Subscription modified | Update status and billing dates |
| `customer.subscription.deleted` | Subscription canceled | Downgrade to free plan |
| `invoice.payment_succeeded` | Monthly payment | Reset usage counters |
| `invoice.payment_failed` | Payment failed | Mark subscription as past due |

## 🧪 9. Production Deployment

### Environment Setup
1. **Update environment variables** with production Stripe keys
2. **Set up production webhook endpoint**
3. **Update Stripe webhook URL** to production domain

### Database Migration
1. **Run the schema** on production Supabase
2. **Test webhook connectivity**
3. **Verify RLS policies** are working

### Testing Checklist
- [ ] User signup creates subscription records
- [ ] Payment processing works end-to-end
- [ ] Webhooks update database correctly
- [ ] Goal limits are enforced
- [ ] Usage tracking is accurate
- [ ] Error handling is graceful

## 🔧 10. Customization Options

### Plan Configuration
Edit `/lib/stripe.ts` to modify:
- Plan names and descriptions
- Pricing and limits
- Feature lists

### Usage Limits
Modify limits in:
- Database schema (default values)
- Subscription service functions
- Stripe plan configuration

### UI Styling
The components use your existing design system:
- Tailwind CSS classes
- Shadcn/ui components
- Consistent with your brand colors

## 🆘 11. Troubleshooting

### Common Issues

**Webhook not receiving events**:
- Check webhook URL is accessible
- Verify webhook secret matches
- Check Stripe webhook logs for errors

**Database permission errors**:
- Verify RLS policies are set up
- Check service role key has proper permissions
- Ensure user authentication is working

**Payment processing fails**:
- Verify Stripe keys are correct
- Check browser console for JavaScript errors
- Test with different cards

**Subscription limits not enforced**:
- Check database triggers are working
- Verify usage tracking functions
- Test goal creation flow

### Debug Mode
Add logging to troubleshoot:
```typescript
console.log('Subscription check:', { userId, canCreate })
console.log('Usage metrics:', usage)
```

## 🎉 12. Next Steps

With Stripe integration complete, consider:

1. **Analytics**: Track subscription conversion rates
2. **Email notifications**: Payment confirmations and billing reminders
3. **Team features**: Implement Garden plan collaboration
4. **Mobile app**: Extend subscription to mobile platforms
5. **Advanced features**: Usage alerts, billing history, invoices

## 📞 Support

For questions or issues:
1. Check Stripe documentation
2. Review Supabase auth guides
3. Test with Stripe's test mode first
4. Use Stripe CLI for local webhook testing

---

**🎯 Your Stripe integration is now complete!** Users can sign up for free, experience your AI goal planning features, and upgrade to paid plans for unlimited access.