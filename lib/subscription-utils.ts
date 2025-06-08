import { supabase } from "@/lib/supabase"

export interface SubscriptionStatus {
    hasActiveSubscription: boolean
    subscriptionId: string | null
    status: string | null
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
}

/**
 * Check if a user has an active subscription
 */
export async function checkSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    try {
        const { data: subscription, error } = await supabase()
            .from("subscriptions")
            .select("id, status, current_period_end, cancel_at_period_end")
            .eq("user_id", userId)
            .in("status", ["active", "trialing"])
            .single()

        if (error && error.code !== "PGRST116") {
            throw error
        }

        if (!subscription) {
            return {
                hasActiveSubscription: false,
                subscriptionId: null,
                status: null,
                currentPeriodEnd: null,
                cancelAtPeriodEnd: false,
            }
        }

        return {
            hasActiveSubscription: true,
            subscriptionId: subscription.id,
            status: subscription.status,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
        }
    } catch (error) {
        console.error("Error checking subscription status:", error)
        return {
            hasActiveSubscription: false,
            subscriptionId: null,
            status: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
        }
    }
}

/**
 * Check if a user has access to premium features
 */
export async function hasSubscriptionAccess(userId: string): Promise<boolean> {
    const status = await checkSubscriptionStatus(userId)
    return status.hasActiveSubscription
}

/**
 * Get subscription details for a user
 */
export async function getSubscriptionDetails(userId: string) {
    try {
        const { data: subscription, error } = await supabase()
            .from("subscriptions")
            .select(`
        id,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        trial_end,
        prices (
          id,
          unit_amount,
          currency,
          interval,
          interval_count,
          products (
            id,
            name,
            description
          )
        )
      `)
            .eq("user_id", userId)
            .in("status", ["active", "trialing", "past_due"])
            .single()

        if (error && error.code !== "PGRST116") {
            throw error
        }

        return subscription
    } catch (error) {
        console.error("Error fetching subscription details:", error)
        return null
    }
}

/**
 * Middleware helper to check subscription access
 */
export function requireSubscription() {
    return async (userId: string) => {
        const hasAccess = await hasSubscriptionAccess(userId)
        if (!hasAccess) {
            throw new Error("Active subscription required")
        }
        return true
    }
}
