import { supabase } from "@/lib/supabase"
import { stripe, type PlanType } from "@/lib/stripe"
import type { DatabaseSubscription, DatabaseUsageMetrics } from "@/types/database"

export interface UserSubscription {
  id: string
  planType: PlanType
  status: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  stripeSubscriptionId: string | null
  stripeCustomerId: string | null
}

export interface UserUsage {
  goalsCreated: number
  goalsLimit: number
  aiRequestsCount: number
  aiRequestsLimit: number
  lastResetDate: string
}

// Get user's subscription
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  const { data, error } = await supabase()
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (error) {
    console.error("Error fetching subscription:", error)
    return null
  }

  if (!data) return null

  return {
    id: data.id,
    planType: data.plan_type,
    status: data.status,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end,
    stripeSubscriptionId: data.stripe_subscription_id,
    stripeCustomerId: data.stripe_customer_id,
  }
}

// Get user's usage metrics
export async function getUserUsage(userId: string): Promise<UserUsage | null> {
  const { data, error } = await supabase()
    .from("usage_metrics")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (error) {
    console.error("Error fetching usage metrics:", error)
    return null
  }

  if (!data) return null

  return {
    goalsCreated: data.goals_created,
    goalsLimit: data.goals_limit,
    aiRequestsCount: data.ai_requests_count,
    aiRequestsLimit: data.ai_requests_limit,
    lastResetDate: data.last_reset_date,
  }
}

// Create or update subscription
export async function upsertSubscription(
  userId: string,
  subscriptionData: Partial<DatabaseSubscription>
): Promise<DatabaseSubscription | null> {
  const { data, error } = await supabase()
    .from("subscriptions")
    .upsert({
      user_id: userId,
      ...subscriptionData,
    })
    .select()
    .single()

  if (error) {
    console.error("Error upserting subscription:", error)
    return null
  }

  return data
}

// Create or update usage metrics
export async function upsertUsageMetrics(
  userId: string,
  usageData: Partial<DatabaseUsageMetrics>
): Promise<DatabaseUsageMetrics | null> {
  const { data, error } = await supabase()
    .from("usage_metrics")
    .upsert({
      user_id: userId,
      ...usageData,
    })
    .select()
    .single()

  if (error) {
    console.error("Error upserting usage metrics:", error)
    return null
  }

  return data
}

// Initialize default subscription and usage for new users
export async function initializeUserSubscription(userId: string): Promise<void> {
  try {
    // Create default subscription (seedling/free)
    await upsertSubscription(userId, {
      plan_type: "seedling",
      status: "active",
      cancel_at_period_end: false,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      current_period_start: null,
      current_period_end: null,
    })

    // Create default usage metrics
    await upsertUsageMetrics(userId, {
      goals_created: 0,
      goals_limit: 3, // Seedling plan limit
      ai_requests_count: 0,
      ai_requests_limit: 50, // Seedling plan limit
      last_reset_date: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error initializing user subscription:", error)
  }
}

// Check if user can create more goals
export async function canCreateGoal(userId: string): Promise<boolean> {
  const usage = await getUserUsage(userId)
  if (!usage) return false

  // If goals_limit is -1, it means unlimited
  if (usage.goalsLimit === -1) return true

  return usage.goalsCreated < usage.goalsLimit
}

// Check if user can make AI requests
export async function canMakeAIRequest(userId: string): Promise<boolean> {
  const usage = await getUserUsage(userId)
  if (!usage) return false

  // Check if we need to reset monthly counters
  const lastReset = new Date(usage.lastResetDate)
  const now = new Date()
  const monthsDiff = (now.getFullYear() - lastReset.getFullYear()) * 12 + 
                     (now.getMonth() - lastReset.getMonth())

  if (monthsDiff >= 1) {
    // Reset monthly counters
    await upsertUsageMetrics(userId, {
      ai_requests_count: 0,
      last_reset_date: now.toISOString(),
    })
    return true
  }

  // If ai_requests_limit is -1, it means unlimited
  if (usage.aiRequestsLimit === -1) return true

  return usage.aiRequestsCount < usage.aiRequestsLimit
}

// Increment goal count
export async function incrementGoalCount(userId: string): Promise<void> {
  const usage = await getUserUsage(userId)
  if (usage) {
    await upsertUsageMetrics(userId, {
      goals_created: usage.goalsCreated + 1,
    })
  }
}

// Increment AI request count
export async function incrementAIRequestCount(userId: string): Promise<void> {
  const usage = await getUserUsage(userId)
  if (usage) {
    await upsertUsageMetrics(userId, {
      ai_requests_count: usage.aiRequestsCount + 1,
    })
  }
}

// Create Stripe customer
export async function createStripeCustomer(userId: string, email: string): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  })

  // Update subscription with customer ID
  await upsertSubscription(userId, {
    stripe_customer_id: customer.id,
  })

  return customer.id
}

// Get or create Stripe customer
export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  const subscription = await getUserSubscription(userId)
  
  if (subscription?.stripeCustomerId) {
    return subscription.stripeCustomerId
  }

  return createStripeCustomer(userId, email)
}