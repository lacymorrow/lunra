import { supabase } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET

let stripe: Stripe | null = null

if (stripeSecretKey) {
    stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2024-04-10",
    })
} else {
    console.error("STRIPE_SECRET_KEY is not set")
}

if (!stripeWebhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set")
}

export async function POST(req: NextRequest) {
    if (!stripeSecretKey || !stripeWebhookSecret || !stripe) {
        return NextResponse.json({ error: "Stripe configuration missing" }, { status: 500 })
    }

    const body = await req.text()
    const sig = req.headers.get("stripe-signature")

    if (!sig) {
        return NextResponse.json({ error: "No signature found" }, { status: 400 })
    }

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(body, sig, stripeWebhookSecret)
    } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message)
        return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 })
    }

    try {
        switch (event.type) {
            case "customer.subscription.created":
            case "customer.subscription.updated":
                await handleSubscriptionChange(event.data.object as Stripe.Subscription)
                break
            case "customer.subscription.deleted":
                await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
                break
            case "invoice.payment_succeeded":
                await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
                break
            case "invoice.payment_failed":
                await handlePaymentFailed(event.data.object as Stripe.Invoice)
                break
            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        return NextResponse.json({ received: true })
    } catch (error: any) {
        console.error("Webhook error:", error)
        return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
    }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string
    const priceId = subscription.items.data[0]?.price.id

    // Get user ID from customer
    const { data: customerData, error: customerError } = await supabase()
        .from("customers")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single()

    if (customerError || !customerData) {
        console.error("Customer not found in database:", customerId)
        return
    }

    const subscriptionData = {
        id: subscription.id,
        user_id: customerData.id,
        status: subscription.status,
        price_id: priceId,
        quantity: subscription.items.data[0]?.quantity || 1,
        cancel_at_period_end: subscription.cancel_at_period_end,
        created: new Date(subscription.created * 1000).toISOString(),
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
        cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        metadata: subscription.metadata,
    }

    const { error } = await supabase()
        .from("subscriptions")
        .upsert(subscriptionData, { onConflict: "id" })

    if (error) {
        console.error("Error upserting subscription:", error)
        throw error
    }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const { error } = await supabase()
        .from("subscriptions")
        .update({
            status: "canceled",
            canceled_at: new Date().toISOString(),
        })
        .eq("id", subscription.id)

    if (error) {
        console.error("Error updating deleted subscription:", error)
        throw error
    }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
    if (invoice.subscription && stripe) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
        await handleSubscriptionChange(subscription)
    }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
    if (invoice.subscription && stripe) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
        await handleSubscriptionChange(subscription)
    }
}
