import { createSubscription, updateUserProfile } from '@/lib/services/subscriptions'
import { PLANS, stripe } from '@/lib/stripe'
import { createClientServerWithAuth } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
	try {
		console.log('🎉 [checkout-success] Starting checkout success processing')

		const { searchParams } = new URL(request.url)
		const sessionId = searchParams.get('session_id')

		console.log('🔍 [checkout-success] Session ID:', sessionId)

		if (!sessionId) {
			console.log('❌ [checkout-success] Missing session ID')
			return NextResponse.redirect(new URL('/dashboard?error=missing_session', request.url))
		}

		// Retrieve the checkout session from Stripe
		console.log('🛒 [checkout-success] Retrieving Stripe checkout session...')
		const session = await stripe.checkout.sessions.retrieve(sessionId)

		console.log('🛒 [checkout-success] Session details:', {
			sessionId: session.id,
			paymentStatus: session.payment_status,
			mode: session.mode,
			customer: session.customer,
			subscription: session.subscription,
			metadata: session.metadata
		})

		if (!session || session.payment_status !== 'paid') {
			console.log('❌ [checkout-success] Payment not completed:', {
				hasSession: !!session,
				paymentStatus: session?.payment_status
			})
			return NextResponse.redirect(new URL('/dashboard?error=payment_failed', request.url))
		}

		// Get the authenticated user
		console.log('🔑 [checkout-success] Getting authenticated user...')
		const supabase = createClientServerWithAuth(request)
		const { data: { user }, error: authError } = await supabase.auth.getUser()

		console.log('🔑 [checkout-success] Auth result:', {
			hasUser: !!user,
			userId: user?.id,
			authError: authError?.message
		})

		if (authError || !user) {
			console.log('❌ [checkout-success] Authentication failed')
			return NextResponse.redirect(new URL('/auth/signin', request.url))
		}

		// Verify this session belongs to this user
		const { userId, planId } = session.metadata || {}
		console.log('🔍 [checkout-success] Metadata verification:', {
			sessionUserId: userId,
			currentUserId: user.id,
			planId: planId,
			matches: userId === user.id
		})

		if (userId !== user.id) {
			console.log('❌ [checkout-success] User ID mismatch - unauthorized')
			return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url))
		}

		try {
			// Get the subscription from Stripe
			if (session.subscription && session.mode === 'subscription') {
				console.log('💳 [checkout-success] Processing subscription...')
				const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

				console.log('💳 [checkout-success] Stripe subscription details:', {
					subscriptionId: subscription.id,
					status: subscription.status,
					currentPeriodStart: subscription.current_period_start,
					currentPeriodEnd: subscription.current_period_end,
					cancelAtPeriodEnd: subscription.cancel_at_period_end
				})

				// Create subscription record in database
				console.log('📝 [checkout-success] Creating subscription in database...')
				const subscriptionData = {
					user_id: user.id,
					stripe_customer_id: session.customer as string,
					stripe_subscription_id: subscription.id,
					plan_id: planId as 'seedling' | 'bloom',
					status: subscription.status as any,
					current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
					current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
					cancel_at_period_end: subscription.cancel_at_period_end,
				}

				console.log('📝 [checkout-success] Subscription data to insert:', subscriptionData)

				const createdSubscription = await createSubscription(subscriptionData)

				console.log('📝 [checkout-success] Created subscription result:', {
					success: !!createdSubscription,
					subscriptionId: createdSubscription?.id
				})

				// Update user profile with new plan
				const plan = PLANS[planId as keyof typeof PLANS]
				console.log('👤 [checkout-success] Updating user profile...', {
					planId: planId,
					goalsLimit: plan.goalsLimit,
					customerId: session.customer
				})

				const profileUpdateData = {
					plan_id: planId as 'seedling' | 'bloom',
					goals_limit: plan.goalsLimit,
					stripe_customer_id: session.customer as string,
				}

				console.log('👤 [checkout-success] Profile update data:', profileUpdateData)

				const updatedProfile = await updateUserProfile(user.id, profileUpdateData)

				console.log('👤 [checkout-success] Updated profile result:', {
					success: !!updatedProfile,
					profileId: updatedProfile?.id,
					newPlanId: updatedProfile?.plan_id,
					newGoalsLimit: updatedProfile?.goals_limit
				})

			} else {
				console.log('⚠️ [checkout-success] Not a subscription mode or no subscription found')
			}

			// Redirect to dashboard with success message
			console.log('✅ [checkout-success] Processing complete, redirecting to dashboard')
			return NextResponse.redirect(new URL('/dashboard?success=subscription_created', request.url))
		} catch (dbError) {
			console.error('❌ [checkout-success] Database error after successful payment:', dbError)
			// Payment succeeded but database update failed - still redirect to dashboard
			// They can try to sync their subscription later
			return NextResponse.redirect(new URL('/dashboard?warning=sync_needed', request.url))
		}

	} catch (error) {
		console.error('❌ [checkout-success] Error processing checkout success:', error)
		return NextResponse.redirect(new URL('/dashboard?error=processing_failed', request.url))
	}
}
