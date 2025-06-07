import { NextRequest, NextResponse } from "next/server"
import { stripe, STRIPE_PLANS } from "@/lib/stripe"
import { upsertSubscription, upsertUsageMetrics } from "@/lib/services/subscriptions"
import Stripe from "stripe"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const planType = session.metadata?.planType
        
        if (!userId || !planType || !session.subscription) {
          console.error("Missing metadata in checkout session")
          break
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        // Update subscription in database
        await upsertSubscription(userId, {
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          plan_type: planType as any,
          status: "active",
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        })

        // Update usage limits based on plan
        const plan = STRIPE_PLANS[planType as keyof typeof STRIPE_PLANS]
        await upsertUsageMetrics(userId, {
          goals_limit: plan.limits.goals,
          ai_requests_limit: plan.limits.aiRequests,
          ai_requests_count: 0, // Reset on new subscription
          last_reset_date: new Date().toISOString(),
        })

        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (!userId) {
          console.error("Missing userId in subscription metadata")
          break
        }

        await upsertSubscription(userId, {
          status: subscription.status as any,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        })

        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (!userId) {
          console.error("Missing userId in subscription metadata")
          break
        }

        // Downgrade to free plan
        await upsertSubscription(userId, {
          plan_type: "seedling",
          status: "canceled",
          stripe_subscription_id: null,
          current_period_start: null,
          current_period_end: null,
          cancel_at_period_end: false,
        })

        // Reset to free plan limits
        const freePlan = STRIPE_PLANS.seedling
        await upsertUsageMetrics(userId, {
          goals_limit: freePlan.limits.goals,
          ai_requests_limit: freePlan.limits.aiRequests,
          ai_requests_count: 0,
          last_reset_date: new Date().toISOString(),
        })

        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        
        // Check if invoice has subscription (as string or expanded object)
        if (!invoice.subscription) {
          console.error("No subscription in invoice")
          break
        }

        const subscriptionId = typeof invoice.subscription === 'string' 
          ? invoice.subscription 
          : invoice.subscription.id

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = subscription.metadata?.userId

        if (!userId) {
          console.error("Missing userId in subscription metadata")
          break
        }

        // Reset monthly usage on successful payment
        await upsertUsageMetrics(userId, {
          ai_requests_count: 0,
          last_reset_date: new Date().toISOString(),
        })

        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        
        // Check if invoice has subscription (as string or expanded object)
        if (!invoice.subscription) {
          console.error("No subscription in invoice")
          break
        }

        const subscriptionId = typeof invoice.subscription === 'string' 
          ? invoice.subscription 
          : invoice.subscription.id

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = subscription.metadata?.userId

        if (!userId) {
          console.error("Missing userId in subscription metadata")
          break
        }

        await upsertSubscription(userId, {
          status: "past_due",
        })

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}