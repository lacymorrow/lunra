import { createSubscription, getSubscriptionByStripeId, updateSubscription, updateUserProfile } from '@/lib/services/subscriptions'
import { PLANS, isValidPlanId, stripe } from '@/lib/stripe'
import type Stripe from 'stripe'

/**
 * Shared Stripe webhook event handler used by all webhook endpoints.
 * Returns { handled: boolean } on success, throws on unrecoverable error.
 */
export async function handleStripeEvent(event: Stripe.Event, label: string): Promise<{ handled: boolean }> {
	switch (event.type) {
		case 'checkout.session.completed': {
			const session = event.data.object as Stripe.Checkout.Session
			const userId = session.metadata?.userId
			const planId = session.metadata?.planId

			if (!userId || !planId || !isValidPlanId(planId)) {
				console.error(`[${label}] Missing or invalid metadata:`, { userId, planId })
				return { handled: false }
			}

			if (session.mode === 'subscription') {
				const subscriptionId = typeof session.subscription === 'string'
					? session.subscription
					: session.subscription?.id
				if (!subscriptionId) {
					console.error(`[${label}] No subscription ID on checkout session`)
					return { handled: false }
				}
				const subscription = await stripe.subscriptions.retrieve(subscriptionId)
				const subItem = subscription.items.data[0]

				await createSubscription({
					user_id: userId,
					stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id ?? '',
					stripe_subscription_id: subscription.id,
					plan_id: planId,
					status: subscription.status as any,
					current_period_start: subItem ? new Date(subItem.current_period_start * 1000).toISOString() : new Date().toISOString(),
					current_period_end: subItem ? new Date(subItem.current_period_end * 1000).toISOString() : new Date().toISOString(),
					cancel_at_period_end: subscription.cancel_at_period_end,
				})

				const plan = PLANS[planId as keyof typeof PLANS]
				await updateUserProfile(userId, {
					plan_id: planId,
					goals_limit: plan.goalsLimit,
				})
			}
			return { handled: true }
		}

		case 'customer.subscription.updated': {
			const subscription = event.data.object
			const updItem = subscription.items?.data?.[0]
			const dbSubscription = await getSubscriptionByStripeId(subscription.id)

			if (dbSubscription) {
				await updateSubscription(dbSubscription.user_id, {
					status: subscription.status as any,
					current_period_start: updItem ? new Date(updItem.current_period_start * 1000).toISOString() : new Date().toISOString(),
					current_period_end: updItem ? new Date(updItem.current_period_end * 1000).toISOString() : new Date().toISOString(),
					cancel_at_period_end: subscription.cancel_at_period_end,
				})

				const planId = subscription.items.data[0]?.price?.id === PLANS.bloom.priceId ? 'bloom' : 'seedling'
				const plan = PLANS[planId]

				await updateUserProfile(dbSubscription.user_id, {
					plan_id: planId,
					goals_limit: plan.goalsLimit,
				})
			}
			return { handled: true }
		}

		case 'customer.subscription.deleted': {
			const subscription = event.data.object
			const dbSubscription = await getSubscriptionByStripeId(subscription.id)

			if (dbSubscription) {
				await updateSubscription(dbSubscription.user_id, {
					status: 'canceled',
				})

				await updateUserProfile(dbSubscription.user_id, {
					plan_id: 'seedling',
					goals_limit: PLANS.seedling.goalsLimit,
				})
			}
			return { handled: true }
		}

		case 'invoice.payment_failed': {
			const invoice = event.data.object
			const invoiceSubRaw = invoice.parent?.subscription_details?.subscription
			const invoiceSubId = typeof invoiceSubRaw === 'string' ? invoiceSubRaw : invoiceSubRaw?.id
			if (invoiceSubId) {
				const dbSubscription = await getSubscriptionByStripeId(invoiceSubId)
				if (dbSubscription) {
					await updateSubscription(dbSubscription.user_id, {
						status: 'past_due',
					})
				}
			}
			return { handled: true }
		}

		default:
			console.log(`[${label}] Unhandled event type: ${event.type}`)
			return { handled: false }
	}
}
