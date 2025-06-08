import { supabase } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

let stripe: Stripe | null = null

if (stripeSecretKey) {
    stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2024-04-10",
    })
} else {
    console.error("STRIPE_SECRET_KEY is not set")
}

export async function POST(req: NextRequest) {
    if (!stripeSecretKey || !stripe) {
        return NextResponse.json({ error: "Stripe configuration missing" }, { status: 500 })
    }

    try {
        const { action, userId, subscriptionId } = await req.json()

        if (!action || !userId) {
            return NextResponse.json({ error: "Action and userId are required" }, { status: 400 })
        }

        // Verify user owns the subscription
        const { data: subscription, error: subError } = await supabase()
            .from("subscriptions")
            .select("id, status")
            .eq("user_id", userId)
            .eq("id", subscriptionId)
            .single()

        if (subError || !subscription) {
            return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
        }

        switch (action) {
            case "cancel":
                const canceledSub = await stripe.subscriptions.update(subscriptionId, {
                    cancel_at_period_end: true,
                })
                return NextResponse.json({
                    success: true,
                    message: "Subscription will be canceled at the end of the current period",
                    subscription: canceledSub
                })

            case "reactivate":
                const reactivatedSub = await stripe.subscriptions.update(subscriptionId, {
                    cancel_at_period_end: false,
                })
                return NextResponse.json({
                    success: true,
                    message: "Subscription reactivated",
                    subscription: reactivatedSub
                })

            case "cancel_immediately":
                const deletedSub = await stripe.subscriptions.cancel(subscriptionId)
                return NextResponse.json({
                    success: true,
                    message: "Subscription canceled immediately",
                    subscription: deletedSub
                })

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 })
        }
    } catch (error: any) {
        console.error("Error managing subscription:", error)
        return NextResponse.json({ error: error.message || "Failed to manage subscription" }, { status: 500 })
    }
}
