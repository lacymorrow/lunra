// Client-safe Stripe configuration (no server-only environment variables)

// Stripe pricing configuration
export const PLANS = {
	seedling: {
		name: 'Seedling',
		price: 0,
		priceId: '', // Free plan doesn't need a price ID
		goalsLimit: 3,
		features: [
			'3 cherished goals',
			'gentle AI guidance',
			'weekly reflections',
			'progress celebration',
			'mobile companion',
		],
	},
	bloom: {
		name: 'Bloom',
		price: 9,
		priceId: 'price_1QWZ9bG2r4n9D9k0xJ8x4x4x', // This will be overridden by environment variable on server
		goalsLimit: -1, // unlimited
		features: [
			'unlimited aspirations',
			'advanced AI mentorship',
			'custom timelines',
			'detailed insights',
			'community connection',
			'priority care',
		],
	},
} as const

export type PlanId = keyof typeof PLANS

export function getPlanById(planId: string): typeof PLANS[PlanId] | null {
	return PLANS[planId as PlanId] || null
}

// Helper function to check if plan ID is valid
export function isValidPlanId(planId: string): planId is PlanId {
	return planId in PLANS
}
