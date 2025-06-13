# Database Management

This document explains how to manage your Lunra database during development.

## Overview

The database consists of the following main tables:

- `auth.users` - Supabase authentication users
- `user_profiles` - User profile information and subscription plans
- `subscriptions` - Stripe subscription data
- `goals` - User goals and progress tracking
- `milestones` - Goal milestones and tasks

## Development Scripts

### Reset Database

To completely reset your database and remove all data:

```bash
npm run db:reset
```

This will:

1. Delete all milestones
2. Delete all goals
3. Delete all subscriptions
4. Delete all user profiles
5. Delete all auth users

⚠️ **Warning**: This will permanently delete ALL data in your database!

### Manual Reset via API

You can also reset the database via the API:

```bash
curl -X POST http://localhost:3000/api/dev/reset-database \
  -H "Content-Type: application/json" \
  -d '{"confirm": "RESET_DATABASE"}'
```

## Safety Features

- **Development Only**: All reset functionality is disabled in production
- **Confirmation Required**: You must type "RESET_DATABASE" to confirm
- **Cascading Deletes**: Foreign key relationships ensure clean deletion
- **Error Handling**: Graceful handling of missing data or errors

## Database Schema Setup

The database reset only clears data, not the schema. If you need to recreate your database schema from scratch:

1. Use the Supabase dashboard SQL editor or CLI to run your setup scripts in this order:
   - `scripts/01-create-goals-schema.sql`
   - `scripts/02-setup-rls-policies.sql`
   - `scripts/03-create-helper-functions.sql`
   - `scripts/create-subscription-tables.sql`
2. Optionally seed sample data: `scripts/04-seed-sample-data.sql` (requires a logged-in user)

## Row Level Security (RLS)

All tables use Row Level Security to ensure users can only access their own data:

- **Goals & Milestones**: Users can only see/modify their own goals
- **User Profiles**: Users can only see/modify their own profile
- **Subscriptions**: Users can only see/modify their own subscription

## Troubleshooting

### Payment Issues

If you're experiencing authentication issues with Stripe payments:

1. Check that your environment variables are set correctly:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`

2. Ensure you're signed in before attempting to create a checkout session

3. Check the browser console and server logs for authentication errors

### Database Connection Issues

If you can't connect to the database:

1. Verify your Supabase environment variables
2. Check that your Supabase project is active
3. Ensure your API keys have the correct permissions

## API Endpoints

### Development Endpoints

- `POST /api/dev/reset-database` - Reset all database data

### Stripe Payment Endpoints

- `POST /api/stripe/create-checkout-session` - Create Stripe checkout
- `POST /api/stripe/create-portal-session` - Create billing portal
- `GET /api/stripe/checkout-success` - Handle successful payments
- `POST /api/stripe/webhook` - Handle Stripe webhooks
- `POST /api/stripe/sync-subscription` - Sync subscription status

## Environment Variables

Make sure you have these environment variables set in your `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

## Best Practices

1. **Always backup** important data before resetting
2. **Test locally** before deploying database changes
3. **Use migrations** for production database changes
4. **Monitor logs** when debugging authentication issues
5. **Keep environment variables secure** and never commit them
