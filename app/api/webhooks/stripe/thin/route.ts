import { createSubscription, getSubscriptionByStripeId, updateSubscription, updateUserProfile } from '@/lib/services/subscriptions'
import { PLANS, stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    console.log('🎯 [webhook-thin] Processing Stripe webhook event')

    const body = await request.text()
    const signature = (await headers()).get('stripe-signature')
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_THIN

    let event: any

    // Check if webhook secret is configured
    if (!webhookSecret) {
        console.error('🚨 [webhook-thin] STRIPE_WEBHOOK_SECRET_THIN not configured!')
        console.error('🚨 [webhook-thin] Add STRIPE_WEBHOOK_SECRET_THIN to your environment variables')
        return NextResponse.json({
            error: 'Webhook secret not configured',
            message: 'Add STRIPE_WEBHOOK_SECRET_THIN to your environment variables'
        }, { status: 500 })
    }

    if (!signature) {
        console.error('❌ [webhook-thin] No Stripe signature found in request headers')
        return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
        console.log('✅ [webhook-thin] Webhook signature verified successfully')
        console.log('🎯 [webhook-thin] Event type:', event.type)
    } catch (err) {
        console.error('❌ [webhook-thin] Webhook signature verification failed:', err)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object
                const { userId, planId } = session.metadata

                console.log('🛒 [webhook-thin] Processing checkout session completed:', {
                    sessionId: session.id,
                    userId,
                    planId,
                    mode: session.mode
                })

                if (session.mode === 'subscription') {
                    const subscription = await stripe.subscriptions.retrieve(session.subscription)
                    const thinItem = subscription.items.data[0]

                    console.log('💳 [webhook-thin] Creating subscription record:', {
                        userId,
                        stripeCustomerId: session.customer,
                        stripeSubscriptionId: subscription.id,
                        planId,
                        status: subscription.status
                    })

                    await createSubscription({
                        user_id: userId,
                        stripe_customer_id: session.customer,
                        stripe_subscription_id: subscription.id,
                        plan_id: planId,
                        status: subscription.status as any,
                        current_period_start: thinItem ? new Date(thinItem.current_period_start * 1000).toISOString() : new Date().toISOString(),
                        current_period_end: thinItem ? new Date(thinItem.current_period_end * 1000).toISOString() : new Date().toISOString(),
                        cancel_at_period_end: subscription.cancel_at_period_end,
                    })

                    const plan = PLANS[planId as keyof typeof PLANS]
                    console.log('👤 [webhook-thin] Updating user profile:', {
                        userId,
                        planId,
                        goalsLimit: plan.goalsLimit
                    })

                    await updateUserProfile(userId, {
                        plan_id: planId,
                        goals_limit: plan.goalsLimit,
                    })

                    console.log('✅ [webhook-thin] Successfully processed checkout session')
                }
                break
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object
                const updThinItem = subscription.items?.data?.[0]
                console.log('🔄 [webhook-thin] Processing subscription updated:', subscription.id)

                const dbSubscription = await getSubscriptionByStripeId(subscription.id)

                if (dbSubscription) {
                    console.log('📝 [webhook-thin] Updating subscription status:', {
                        userId: dbSubscription.user_id,
                        newStatus: subscription.status
                    })

                    await updateSubscription(dbSubscription.user_id, {
                        status: subscription.status as any,
                        current_period_start: updThinItem ? new Date(updThinItem.current_period_start * 1000).toISOString() : new Date().toISOString(),
                        current_period_end: updThinItem ? new Date(updThinItem.current_period_end * 1000).toISOString() : new Date().toISOString(),
                        cancel_at_period_end: subscription.cancel_at_period_end,
                    })

                    // Update user profile if plan changed
                    const planId = subscription.items.data[0]?.price?.id === PLANS.bloom.priceId ? 'bloom' : 'seedling'
                    const plan = PLANS[planId]

                    console.log('👤 [webhook-thin] Updating user plan:', {
                        userId: dbSubscription.user_id,
                        planId,
                        goalsLimit: plan.goalsLimit
                    })

                    await updateUserProfile(dbSubscription.user_id, {
                        plan_id: planId,
                        goals_limit: plan.goalsLimit,
                    })

                    console.log('✅ [webhook-thin] Successfully processed subscription update')
                } else {
                    console.warn('⚠️ [webhook-thin] Subscription not found in database:', subscription.id)
                }
                break
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object
                console.log('🗑️ [webhook-thin] Processing subscription deleted:', subscription.id)

                const dbSubscription = await getSubscriptionByStripeId(subscription.id)

                if (dbSubscription) {
                    console.log('📝 [webhook-thin] Canceling subscription:', {
                        userId: dbSubscription.user_id,
                        subscriptionId: subscription.id
                    })

                    await updateSubscription(dbSubscription.user_id, {
                        status: 'canceled',
                    })

                    // Downgrade to free plan
                    console.log('👤 [webhook-thin] Downgrading to free plan:', dbSubscription.user_id)
                    await updateUserProfile(dbSubscription.user_id, {
                        plan_id: 'seedling',
                        goals_limit: PLANS.seedling.goalsLimit,
                    })

                    console.log('✅ [webhook-thin] Successfully processed subscription deletion')
                } else {
                    console.warn('⚠️ [webhook-thin] Subscription not found in database:', subscription.id)
                }
                break
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object
                console.log('💸 [webhook-thin] Processing payment failed:', invoice.id)

                if (invoice.subscription) {
                    const dbSubscription = await getSubscriptionByStripeId(invoice.subscription)
                    if (dbSubscription) {
                        console.log('📝 [webhook-thin] Marking subscription as past due:', {
                            userId: dbSubscription.user_id,
                            subscriptionId: invoice.subscription
                        })

                        await updateSubscription(dbSubscription.user_id, {
                            status: 'past_due',
                        })

                        console.log('✅ [webhook-thin] Successfully processed payment failure')
                    } else {
                        console.warn('⚠️ [webhook-thin] Subscription not found for failed payment:', invoice.subscription)
                    }
                }
                break
            }

            default:
                console.log(`🤷 [webhook-thin] Unhandled event type: ${event.type}`)
        }

        console.log('✅ [webhook-thin] Webhook processing completed successfully')
        return NextResponse.json({ received: true, endpoint: 'thin' })
    } catch (error) {
        console.error('💥 [webhook-thin] Error processing webhook:', error)
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        )
    }
}
