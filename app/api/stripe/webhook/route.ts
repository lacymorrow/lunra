import { createSubscription, getSubscriptionByStripeId, updateSubscription, updateUserProfile } from '@/lib/services/subscriptions'
import { PLANS, stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
	const body = await request.text()
	const signature = (await headers()).get('stripe-signature')
    // Legacy webhook endpoint uses STRIPE_WEBHOOK_SECRET
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

	let event: any

	// Check if webhook secret is configured
	if (!webhookSecret) {
        console.error('🚨 [webhook] STRIPE_WEBHOOK_SECRET not configured!')
        console.error('🚨 [webhook] Webhooks will not work properly')
        console.error('🚨 [webhook] Add STRIPE_WEBHOOK_SECRET to your environment variables')
		return NextResponse.json({
			error: 'Webhook secret not configured',
            message: 'Add STRIPE_WEBHOOK_SECRET to your environment variables'
		}, { status: 500 })
	}

	if (!signature) {
		console.error('❌ [webhook] No Stripe signature found in request headers')
		return NextResponse.json({ error: 'No signature' }, { status: 400 })
	}

	try {
		event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
		console.log('✅ [webhook] Webhook signature verified successfully')
	} catch (err) {
		console.error('❌ [webhook] Webhook signature verification failed:', err)
		return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
	}

	try {
		switch (event.type) {
			case 'checkout.session.completed': {
				const session = event.data.object
				const { userId, planId } = session.metadata

				if (session.mode === 'subscription') {
					const subscription = await stripe.subscriptions.retrieve(session.subscription)

					await createSubscription({
						user_id: userId,
						stripe_customer_id: session.customer,
						stripe_subscription_id: subscription.id,
						plan_id: planId,
						status: subscription.status as any,
						current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
						current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
						cancel_at_period_end: subscription.cancel_at_period_end,
					})

					const plan = PLANS[planId as keyof typeof PLANS]
					await updateUserProfile(userId, {
						plan_id: planId,
						goals_limit: plan.goalsLimit,
					})
				}
				break
			}

			case 'customer.subscription.updated': {
				const subscription = event.data.object
				const dbSubscription = await getSubscriptionByStripeId(subscription.id)

				if (dbSubscription) {
					await updateSubscription(dbSubscription.user_id, {
						status: subscription.status as any,
						current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
						current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
						cancel_at_period_end: subscription.cancel_at_period_end,
					})

					// Update user profile if plan changed
					const planId = subscription.items.data[0]?.price?.id === PLANS.bloom.priceId ? 'bloom' : 'seedling'
					const plan = PLANS[planId]

					await updateUserProfile(dbSubscription.user_id, {
						plan_id: planId,
						goals_limit: plan.goalsLimit,
					})
				}
				break
			}

			case 'customer.subscription.deleted': {
				const subscription = event.data.object
				const dbSubscription = await getSubscriptionByStripeId(subscription.id)

				if (dbSubscription) {
					await updateSubscription(dbSubscription.user_id, {
						status: 'canceled',
					})

					// Downgrade to free plan
					await updateUserProfile(dbSubscription.user_id, {
						plan_id: 'seedling',
						goals_limit: PLANS.seedling.goalsLimit,
					})
				}
				break
			}

			case 'invoice.payment_failed': {
				const invoice = event.data.object
				if (invoice.subscription) {
					const dbSubscription = await getSubscriptionByStripeId(invoice.subscription)
					if (dbSubscription) {
						await updateSubscription(dbSubscription.user_id, {
							status: 'past_due',
						})
					}
				}
				break
			}

			default:
				console.log(`Unhandled event type: ${event.type}`)
		}

		return NextResponse.json({ received: true })
	} catch (error) {
		console.error('Error processing webhook:', error)
		return NextResponse.json(
			{ error: 'Webhook processing failed' },
			{ status: 500 }
		)
	}
}
