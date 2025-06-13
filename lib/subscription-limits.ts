import { PLANS } from '@/lib/stripe-config'
import { DatabaseUserProfile } from '@/types/database'

export function canCreateGoal(userProfile: DatabaseUserProfile | null, currentGoalsCount: number): boolean {
    if (!userProfile) {
        // For unauthenticated users, use localStorage limit (3 goals like seedling)
        return currentGoalsCount < 3
    }

    const plan = PLANS[userProfile.plan_id]

    // If unlimited goals (bloom plan)
    if (plan.goalsLimit === -1) {
        return true
    }

    // Check against the limit
    return currentGoalsCount < plan.goalsLimit
}

export function getGoalsLimit(userProfile: DatabaseUserProfile | null): number {
    if (!userProfile) {
        return 3 // Default for unauthenticated users
    }

    const plan = PLANS[userProfile.plan_id]
    return plan.goalsLimit === -1 ? Infinity : plan.goalsLimit
}

export function getRemainingGoals(userProfile: DatabaseUserProfile | null, currentGoalsCount: number): number {
    const limit = getGoalsLimit(userProfile)
    if (limit === Infinity) {
        return Infinity
    }
    return Math.max(0, limit - currentGoalsCount)
}

export function getLimitMessage(userProfile: DatabaseUserProfile | null, currentGoalsCount: number): string {
    if (!userProfile) {
        return `${currentGoalsCount}/3 goals used. Sign up to track your progress!`
    }

    const plan = PLANS[userProfile.plan_id]

    if (plan.goalsLimit === -1) {
        return `${currentGoalsCount} goals created. Unlimited with Bloom!`
    }

    return `${currentGoalsCount}/${plan.goalsLimit} goals used`
}
