# 🔌 LLM API Reference - Lunra Project

## 🎯 Overview

This document provides a complete API reference for all endpoints, services, and utilities in the Lunra goal-setting application.

## 🔗 API Endpoints

### Payment & Subscription APIs

#### POST `/api/stripe/create-checkout-session`

Creates a Stripe checkout session for plan upgrades.

**Request:**

```json
{
  "planId": "bloom"
}
```

**Response:**

```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

**Authentication:** Required

---

#### GET `/api/stripe/checkout-success`

Handles successful payment completion and updates user permissions.

**Query Parameters:**

- `session_id` - Stripe session ID

**Response:** Redirects to dashboard with success message

**Side Effects:**

- Creates subscription record
- Updates user profile with new plan
- Grants unlimited goals for Bloom plan

---

#### POST `/api/stripe/sync-subscription`

Manually syncs user subscription status from Stripe.

**Authentication:** Required

**Response:**

```json
{
  "success": true,
  "status": "active",
  "plan": "bloom"
}
```

**Use Case:** When webhook processing fails

---

#### POST `/api/stripe/create-portal-session`

Creates Stripe customer portal session for billing management.

**Authentication:** Required

**Response:**

```json
{
  "url": "https://billing.stripe.com/..."
}
```

---

### Webhook Endpoints

#### POST `/api/webhooks/stripe/snapshot`

Primary webhook endpoint for production Stripe events.

**Environment Variable:** `STRIPE_WEBHOOK_SECRET_SNAP`

**Events Handled:**

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

**Response:**

```json
{
  "received": true,
  "endpoint": "snapshot"
}
```

---

#### POST `/api/webhooks/stripe/thin`

Secondary webhook endpoint for redundancy.

**Environment Variable:** `STRIPE_WEBHOOK_SECRET_THIN`

**Events Handled:** Same as snapshot endpoint

**Response:**

```json
{
  "received": true,
  "endpoint": "thin"
}
```

---

#### POST `/api/stripe/webhook`

Legacy webhook endpoint (optional).

**Environment Variable:** `STRIPE_WEBHOOK_SECRET`

---

### Development & Testing APIs

#### GET `/api/dev/test-payment-flow`

Comprehensive health check for the entire payment system.

**Response:**

```json
{
  "timestamp": "2025-06-10T20:09:45.508Z",
  "overallHealth": "healthy|critical",
  "criticalIssues": [],
  "warnings": [],
  "checks": {
    "environment": {
      "hasStripeSecretKey": true,
      "hasWebhookSecretSnap": true,
      "hasWebhookSecretThin": true
    },
    "stripe": {
      "connection": "connected",
      "bloomPriceValid": true
    },
    "user": {
      "authenticated": false
    },
    "webhook": {
      "snapshot": "http://localhost:3000/api/webhooks/stripe/snapshot",
      "thin": "http://localhost:3000/api/webhooks/stripe/thin"
    }
  }
}
```

**Usage:** Primary diagnostic tool for debugging payment issues

---

#### GET `/api/dev/check-stripe-config`

Validates Stripe configuration and price setup.

**Response:**

```json
{
  "success": true,
  "price": {
    "id": "price_1RYJSaFLciJzY1p7hP3mJaXS",
    "active": true,
    "unitAmount": 900
  }
}
```

---

#### POST `/api/dev/fix-webhook-validation`

Temporary development tool to bypass webhook validation.

**⚠️ Warning:** Development only - never use in production

---

## 📚 Service Functions

### Subscription Services (`lib/services/subscriptions.ts`)

#### `getUserProfile(userId: string): Promise<DatabaseUserProfile | null>`

Retrieves user profile with plan information.

**Returns:**

```typescript
{
  id: string
  user_id: string
  plan_id: "seedling" | "bloom"
  goals_limit: number
  stripe_customer_id: string | null
}
```

---

#### `createUserProfile(userId: string, profileData: Partial<...>): Promise<DatabaseUserProfile | null>`

Creates a new user profile with default Seedling plan.

**Default Values:**

- `plan_id`: "seedling"
- `goals_limit`: 3

---

#### `updateUserProfile(userId: string, profileData: Partial<...>): Promise<DatabaseUserProfile | null>`

Updates user profile, typically after subscription changes.

**Common Usage:**

```typescript
await updateUserProfile(userId, {
  plan_id: "bloom",
  goals_limit: -1
})
```

---

#### `getUserSubscription(userId: string): Promise<DatabaseSubscription | null>`

Retrieves active subscription for user.

---

#### `createSubscription(subscriptionData: ...): Promise<DatabaseSubscription | null>`

Creates new subscription record after successful payment.

---

#### `updateSubscription(userId: string, subscriptionData: ...): Promise<DatabaseSubscription | null>`

Updates subscription status and period information.

---

### Goal Services (`lib/services/goals.ts`)

#### `getGoals(userId: string): Promise<DatabaseGoalWithMilestones[]>`

Retrieves all goals for user with milestone statistics.

---

#### `createGoal(goalData: SavedGoal, userId: string): Promise<DatabaseGoal | null>`

Creates new goal (checks plan limits internally).

---

#### `updateGoal(goalId: string, goalData: Partial<SavedGoal>, userId: string): Promise<DatabaseGoal | null>`

Updates existing goal.

---

#### `deleteGoal(goalId: string, userId: string): Promise<void>`

Deletes goal and associated milestones.

---

### Subscription Limits (`lib/subscription-limits.ts`)

#### `canCreateGoal(userProfile: DatabaseUserProfile | null, currentGoalsCount: number): boolean`

Checks if user can create another goal based on their plan.

**Logic:**

- Seedling: Limited to 3 goals
- Bloom: Unlimited (-1)
- Unauthenticated: Limited to 3 goals (localStorage)

---

#### `getGoalsLimit(userProfile: DatabaseUserProfile | null): number`

Returns goal limit for user's plan.

**Returns:**

- `3` for Seedling plan
- `Infinity` for Bloom plan

---

#### `getRemainingGoals(userProfile: DatabaseUserProfile | null, currentGoalsCount: number): number`

Calculates remaining goals user can create.

---

## 🎨 React Components & Hooks

### Authentication Context (`contexts/auth-context.tsx`)

#### `useAuth(): AuthContextType`

Primary hook for accessing user authentication state.

**Returns:**

```typescript
{
  user: User | null
  session: Session | null
  userProfile: DatabaseUserProfile | null
  subscription: DatabaseSubscription | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{error: any}>
  signUp: (email: string, password: string) => Promise<{error: any}>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}
```

**Usage:**

```typescript
const { user, userProfile, subscription, refreshProfile } = useAuth()
```

---

### Data Manager (`lib/data-manager.ts`)

#### `GoalDataManager`

Unified data management for goals with localStorage fallback.

**Methods:**

- `getGoals(): Promise<SavedGoal[]>`
- `createGoal(goalData: SavedGoal): Promise<SavedGoal | null>`
- `updateGoal(id: string | number, goalData: Partial<SavedGoal>): Promise<SavedGoal | null>`
- `deleteGoal(id: string | number): Promise<boolean>`

**Features:**

- Automatic sync between localStorage and database
- Handles authenticated and unauthenticated users
- Seamless transition when user signs in

---

## 🔧 Configuration

### Stripe Configuration (`lib/stripe-config.ts`)

#### `PLANS`

Core plan configuration object.

```typescript
export const PLANS = {
  seedling: {
    name: 'Seedling',
    price: 0,
    goalsLimit: 3,
    features: [...]
  },
  bloom: {
    name: 'Bloom',
    price: 9,
    priceId: 'price_1RYJSaFLciJzY1p7hP3mJaXS',
    goalsLimit: -1,
    features: [...]
  }
}
```

---

#### Utility Functions

- `getPlanById(planId: string)`
- `isValidPlanId(planId: string)`

---

### Supabase Configuration (`lib/supabase-server.ts`)

#### `createClientServer(): SupabaseClient`

Creates server-side Supabase client with service role key.

#### `createClientServerWithAuth(request: NextRequest): SupabaseClient`

Creates server-side client with user authentication context.

**Usage in API routes:**

```typescript
const supabase = createClientServerWithAuth(request)
const { data: { user } } = await supabase.auth.getUser()
```

---

## 🎯 Business Logic Patterns

### Plan Upgrade Flow

1. User clicks "Upgrade to Bloom"
2. `create-checkout-session` creates Stripe session
3. User completes payment on Stripe
4. Stripe sends `checkout.session.completed` webhook
5. Webhook handler:
   - Creates subscription record
   - Updates user profile to Bloom plan
   - Sets `goals_limit: -1`
6. User gets unlimited goal access

### Goal Limit Enforcement

1. User attempts to create goal
2. `canCreateGoal()` checks current count vs limit
3. If at limit, show upgrade prompt
4. If under limit, allow creation

### Subscription Sync

1. User reports missing permissions
2. They click "Sync Status" on billing page
3. `sync-subscription` endpoint:
   - Fetches latest data from Stripe
   - Updates local subscription record
   - Updates user profile with correct plan

---

## 🧪 Testing Patterns

### Payment Flow Testing

```typescript
// 1. Check system health
const health = await fetch('/api/dev/test-payment-flow')

// 2. Create checkout session
const session = await fetch('/api/stripe/create-checkout-session', {
  method: 'POST',
  body: JSON.stringify({ planId: 'bloom' })
})

// 3. Complete payment with test card: 4242 4242 4242 4242

// 4. Verify webhook processing in logs

// 5. Check user profile updated to Bloom plan
const profile = await getUserProfile(userId)
expect(profile.plan_id).toBe('bloom')
expect(profile.goals_limit).toBe(-1)
```

### Subscription State Testing

```typescript
// Test all subscription states
const states = ['active', 'past_due', 'canceled', 'incomplete']

for (const state of states) {
  await updateSubscription(userId, { status: state })
  // Verify appropriate user access level
}
```

---

## 🚨 Error Handling Patterns

### API Route Error Pattern

```typescript
try {
  // Main logic
  return NextResponse.json({ success: true, data })
} catch (error) {
  console.error('❌ [component] Error message:', error)
  return NextResponse.json(
    { error: 'User-friendly message' },
    { status: 500 }
  )
}
```

### Service Function Error Pattern

```typescript
export async function serviceFunction() {
  const { data, error } = await supabase.operation()
  
  if (error) {
    console.error('Error in serviceFunction:', error)
    return null
  }
  
  return data
}
```

### Webhook Error Pattern

```typescript
if (!webhookSecret) {
  console.error('🚨 [webhook] Secret not configured!')
  return NextResponse.json({
    error: 'Configuration error',
    message: 'Add webhook secret to environment'
  }, { status: 500 })
}
```

---

## 📊 Database Schema Reference

### Tables Overview

```sql
-- Core authentication and profiles
user_profiles (id, user_id, plan_id, goals_limit, stripe_customer_id)
subscriptions (id, user_id, stripe_subscription_id, status, plan_id)

-- Goal management
goals (id, user_id, title, description, progress, status)
milestones (id, goal_id, week, task, status, progress)
```

### Key Constraints

- All tables have RLS enabled
- Foreign key relationships enforce data integrity
- Triggers maintain updated_at timestamps
- Functions auto-calculate goal progress

---

## 🎯 Quick Reference Commands

### Health Checks

```bash
# Overall system health
curl "http://localhost:3000/api/dev/test-payment-flow" | jq .

# Stripe configuration
curl "http://localhost:3000/api/dev/check-stripe-config" | jq .
```

### Manual Operations

```bash
# Sync user subscription
curl -X POST "http://localhost:3000/api/stripe/sync-subscription"

# Create billing portal session
curl -X POST "http://localhost:3000/api/stripe/create-portal-session"
```

### Database Queries

```sql
-- Check user plan status
SELECT up.plan_id, up.goals_limit, s.status 
FROM user_profiles up 
LEFT JOIN subscriptions s ON up.user_id = s.user_id 
WHERE up.user_id = 'user-id';

-- Count user goals
SELECT COUNT(*) FROM goals WHERE user_id = 'user-id';
```

---

This API reference provides everything needed to understand, debug, and extend the Lunra payment and goal management system. Always test changes with the diagnostic endpoints before deploying! 🚀
