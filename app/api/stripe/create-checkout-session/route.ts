import { createUserProfile, getUserProfile, updateUserProfile } from '@/lib/services/subscriptions'
import { PLANS, isValidPlanId, stripe } from '@/lib/stripe'
import { createClientServerWithAuth } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
	console.log('🚀 [create-checkout-session] Starting checkout session creation')

	try {
		const body = await request.json()
		const { planId } = body

		console.log('📝 [create-checkout-session] Request body:', { planId })

		if (!planId || !isValidPlanId(planId)) {
			console.error('❌ [create-checkout-session] Invalid plan ID:', planId)
			return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
		}

		if (planId === 'seedling') {
			console.error('❌ [create-checkout-session] Seedling plan does not require checkout')
			return NextResponse.json({ error: 'Free plan does not require checkout' }, { status: 400 })
		}

		console.log('🔍 [create-checkout-session] Environment variables check:', {
			hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
			hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
			hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
			stripeKeyLength: process.env.STRIPE_SECRET_KEY?.length || 0,
			supabaseServiceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
		})

		// Create response object for cookie handling
		const response = NextResponse.json({ success: true })

		// Get the authenticated user
		console.log('🔑 [create-checkout-session] Creating Supabase client...')
		const supabase = createClientServerWithAuth(request, response)

		console.log('🔑 [create-checkout-session] Getting authenticated user...')
		const { data: { user }, error: authError } = await supabase.auth.getUser()

		console.log('🔑 [create-checkout-session] Auth result:', {
			hasUser: !!user,
			userId: user?.id,
			userEmail: user?.email,
			authError: authError?.message,
		})

		if (authError) {
			console.error('❌ [create-checkout-session] Auth error:', authError)
			return NextResponse.json({ error: 'Unauthorized', details: authError.message }, { status: 401 })
		}

		if (!user) {
			console.error('❌ [create-checkout-session] No user found')
			return NextResponse.json({ error: 'Unauthorized', details: 'No user session found' }, { status: 401 })
		}

		console.log('👤 [create-checkout-session] Getting user profile for:', user.id)
		// Get or create user profile
		let userProfile = await getUserProfile(user.id)

		console.log('👤 [create-checkout-session] User profile result:', {
			hasProfile: !!userProfile,
			profileId: userProfile?.id,
			stripeCustomerId: userProfile?.stripe_customer_id,
		})

		if (!userProfile) {
			console.log('👤 [create-checkout-session] Creating new user profile...')
			userProfile = await createUserProfile(user.id, {
				full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || null,
			})

			console.log('👤 [create-checkout-session] Created user profile:', {
				hasProfile: !!userProfile,
				profileId: userProfile?.id,
			})
		}

		if (!userProfile) {
			console.error('❌ [create-checkout-session] Failed to create user profile')
			return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
		}

		const plan = PLANS[planId]
		console.log('💳 [create-checkout-session] Plan details:', {
			planId,
			planName: plan.name,
			planPrice: plan.price,
			planPriceId: plan.priceId,
		})

		// Create or get Stripe customer
		let stripeCustomerId = userProfile.stripe_customer_id || null

		console.log('💳 [create-checkout-session] Stripe customer check:', {
			hasExistingCustomerId: !!stripeCustomerId,
			customerId: stripeCustomerId,
		})

		if (!stripeCustomerId) {
			console.log('💳 [create-checkout-session] Creating new Stripe customer...')
			const customer = await stripe.customers.create({
				email: user.email,
				name: userProfile.full_name || undefined,
				metadata: {
					userId: user.id,
				},
			})
			stripeCustomerId = customer.id

			console.log('💳 [create-checkout-session] Created Stripe customer:', {
				customerId: stripeCustomerId,
				customerEmail: customer.email,
			})

			// Update user profile with stripe_customer_id
			console.log('💳 [create-checkout-session] Updating user profile with Stripe customer ID...')
			await updateUserProfile(user.id, {
				stripe_customer_id: stripeCustomerId,
			})
			console.log('✅ [create-checkout-session] Updated user profile with Stripe customer ID')
		}

		// Create checkout session
		console.log('🛒 [create-checkout-session] Creating Stripe checkout session...')
        const sessionConfig = {
            customer: stripeCustomerId,
            automatic_payment_methods: { enabled: true },
            line_items: [
                {
                    price: plan.priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription' as const,
            success_url: `${request.nextUrl.origin}/api/stripe/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${request.nextUrl.origin}/dashboard?canceled=true`,
            metadata: {
                userId: user.id,
                planId: planId,
            },
        }

		console.log('🛒 [create-checkout-session] Session config:', {
			customer: sessionConfig.customer,
			mode: sessionConfig.mode,
			priceId: plan.priceId,
			successUrl: sessionConfig.success_url,
			cancelUrl: sessionConfig.cancel_url,
			metadata: sessionConfig.metadata,
		})

		const session = await stripe.checkout.sessions.create(sessionConfig)

		console.log('✅ [create-checkout-session] Successfully created checkout session:', {
			sessionId: session.id,
			sessionUrl: session.url,
		})

		return NextResponse.json({ sessionId: session.id, url: session.url })
	} catch (error) {
		console.error('💥 [create-checkout-session] Error creating checkout session:', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		})
		return NextResponse.json(
			{ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		)
	}
}
