import { supabase } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    try {
        const { data: subscription, error } = await supabase()
            .from("subscriptions")
            .select(`
        id,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        trial_end,
        prices (
          id,
          unit_amount,
          currency,
          interval,
          interval_count,
          products (
            id,
            name,
            description
          )
        )
      `)
            .eq("user_id", userId)
            .eq("status", "active")
            .single()

        if (error && error.code !== "PGRST116") {
            throw error
        }

        if (!subscription) {
            return NextResponse.json({
                hasActiveSubscription: false,
                subscription: null
            })
        }

        return NextResponse.json({
            hasActiveSubscription: true,
            subscription: {
                id: subscription.id,
                status: subscription.status,
                currentPeriodStart: subscription.current_period_start,
                currentPeriodEnd: subscription.current_period_end,
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                trialEnd: subscription.trial_end,
                price: subscription.prices,
            },
        })
    } catch (error: any) {
        console.error("Error fetching subscription status:", error)
        return NextResponse.json({ error: "Failed to fetch subscription status" }, { status: 500 })
    }
}
