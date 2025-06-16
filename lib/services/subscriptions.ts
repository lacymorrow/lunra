import { createClientServer } from '@/lib/supabase-server'
import type { DatabaseSubscription, DatabaseUserProfile } from '@/types/database'

// Create a singleton server client for subscription services
const getServerClient = () => createClientServer()

export async function getUserSubscription(userId: string): Promise<DatabaseSubscription | null> {
	const { data, error } = await getServerClient()
		.from('subscriptions')
		.select('*')
		.eq('user_id', userId)
		.single()

	if (error) {
		console.error('Error fetching user subscription:', error)
		return null
	}

	return data
}

export async function getUserProfile(userId: string): Promise<DatabaseUserProfile | null> {
	const { data, error } = await getServerClient()
		.from('user_profiles')
		.select('*')
		.eq('user_id', userId)
		.single()

	if (error) {
		console.error('Error fetching user profile:', error)
		return null
	}

	return data
}

export async function createUserProfile(
	userId: string,
	profileData: Partial<Omit<DatabaseUserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<DatabaseUserProfile | null> {
	const { data, error } = await getServerClient()
		.from('user_profiles')
		.insert({
			user_id: userId,
			plan_id: 'seedling',
			goals_limit: 3,
			...profileData,
		})
		.select()
		.single()

	if (error) {
		console.error('Error creating user profile:', error)

		// If it's a duplicate key error, try to fetch the existing profile
		if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('already exists')) {
			console.log('🔍 [createUserProfile] Profile likely already exists, attempting to fetch existing profile')
			return await getUserProfile(userId)
		}

		return null
	}

	return data
}

export async function updateUserProfile(
	userId: string,
	profileData: Partial<Omit<DatabaseUserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<DatabaseUserProfile | null> {
	console.log('👤 [updateUserProfile] Starting profile update for user:', userId)
	console.log('👤 [updateUserProfile] Update data:', profileData)

	const { data, error } = await getServerClient()
		.from('user_profiles')
		.update(profileData)
		.eq('user_id', userId)
		.select()
		.single()

	if (error) {
		console.error('❌ [updateUserProfile] Error updating user profile:', error)
		return null
	}

	console.log('✅ [updateUserProfile] Successfully updated profile:', data)
	return data
}

export async function createSubscription(
	subscriptionData: Omit<DatabaseSubscription, 'id' | 'created_at' | 'updated_at'>
): Promise<DatabaseSubscription | null> {
	console.log('💳 [createSubscription] Starting subscription creation')
	console.log('💳 [createSubscription] Subscription data:', subscriptionData)

	const { data, error } = await getServerClient()
		.from('subscriptions')
		.insert(subscriptionData)
		.select()
		.single()

	if (error) {
		console.error('❌ [createSubscription] Error creating subscription:', error)
		return null
	}

	console.log('✅ [createSubscription] Successfully created subscription:', data)
	return data
}

export async function updateSubscription(
	userId: string,
	subscriptionData: Partial<Omit<DatabaseSubscription, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<DatabaseSubscription | null> {
	const { data, error } = await getServerClient()
		.from('subscriptions')
		.update(subscriptionData)
		.eq('user_id', userId)
		.select()
		.single()

	if (error) {
		console.error('Error updating subscription:', error)
		return null
	}

	return data
}

export async function getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<DatabaseSubscription | null> {
	const { data, error } = await getServerClient()
		.from('subscriptions')
		.select('*')
		.eq('stripe_subscription_id', stripeSubscriptionId)
		.single()

	if (error) {
		console.error('Error fetching subscription by Stripe ID:', error)
		return null
	}

	return data
}
