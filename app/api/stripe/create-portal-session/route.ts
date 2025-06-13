import { getUserSubscription } from '@/lib/services/subscriptions'
import { stripe } from '@/lib/stripe'
import { createClientServerWithAuth } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
	try {
		// Get the authenticated user
		const supabase = createClientServerWithAuth(request)
		const { data: { user }, error: authError } = await supabase.auth.getUser()

		if (authError || !user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Get user's subscription
		const subscription = await getUserSubscription(user.id)

		if (!subscription || !subscription.stripe_customer_id) {
			return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
		}

		// Create portal session
		const session = await stripe.billingPortal.sessions.create({
			customer: subscription.stripe_customer_id,
			return_url: `${request.nextUrl.origin}/dashboard`,
		})

		return NextResponse.json({ url: session.url })
	} catch (error) {
		console.error('Error creating portal session:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
