import Stripe from 'stripe'
import { PLANS as BASE_PLANS, type PlanId } from './stripe-config'

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is required')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
})

// Server-side PLANS with environment variable price ID
export const PLANS = {
    ...BASE_PLANS,
    bloom: {
        ...BASE_PLANS.bloom,
        priceId: process.env.STRIPE_BLOOM_PRICE_ID || '',
    },
} as const

// Re-export types and utility functions
export type { PlanId }

export function getPlanById(planId: string): typeof PLANS[PlanId] | null {
    return PLANS[planId as PlanId] || null
}

export function isValidPlanId(planId: string): planId is PlanId {
    return planId in PLANS
}
