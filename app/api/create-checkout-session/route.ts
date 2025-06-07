import { NextRequest, NextResponse } from "next/server"
import { stripe, STRIPE_PLANS, type PlanType } from "@/lib/stripe"
import { getOrCreateStripeCustomer } from "@/lib/services/subscriptions"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { planType } = await request.json()

    if (!planType || !(planType in STRIPE_PLANS)) {
      return NextResponse.json(
        { error: "Invalid plan type" },
        { status: 400 }
      )
    }

    // Get user from auth token
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization header" },
        { status: 401 }
      )
    }

    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabase().auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }

    const plan = STRIPE_PLANS[planType as PlanType]

    // Free plan doesn't need checkout
    if (planType === "seedling") {
      return NextResponse.json(
        { error: "Free plan doesn't require checkout" },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(user.id, user.email!)

    // Get the origin for redirect URLs
    const origin = request.headers.get("origin") || "http://localhost:3000"

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/dashboard?success=true`,
      cancel_url: `${origin}/dashboard?canceled=true`,
      metadata: {
        userId: user.id,
        planType,
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}