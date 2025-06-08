import { supabase } from "@/lib/supabase"
import { NextResponse } from "next/server"
import Stripe from "stripe"

// Ensure STRIPE_SECRET_KEY is available
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

let stripe: Stripe | null = null

if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2024-04-10",
  })
} else {
  console.error("Stripe secret key is not set for /api/create-checkout-session.")
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function POST(req: Request) {
  if (!stripeSecretKey || !stripe) {
    return NextResponse.json({ error: "Stripe configuration missing." }, { status: 500 })
  }

  try {
    const { priceId, userId } = await req.json()

    if (!priceId) {
      return NextResponse.json({ error: "Price ID is required" }, { status: 400 })
    }

    let stripeCustomerId: string | undefined = undefined

    // If a userId is provided (i.e., user is logged in), try to get their Stripe Customer ID
    if (userId) {
      const { data: customerData, error: customerError } = await supabase()
        .from("customers")
        .select("stripe_customer_id")
        .eq("id", userId)
        .single()

      if (customerError || !customerData?.stripe_customer_id) {
        console.warn(
          `Could not find Stripe customer ID for user ${userId}. Proceeding without it. Error: ${customerError?.message}`,
        )
      } else {
        stripeCustomerId = customerData.stripe_customer_id
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer: stripeCustomerId,
      success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing/cancel`,
      metadata: userId ? { supabase_user_id: userId } : undefined,
      allow_promotion_codes: true,
    })

    if (!session.url) {
      throw new Error("Failed to create Stripe checkout session: No URL returned.")
    }

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error("Error creating Stripe checkout session:", error)
    return NextResponse.json({ error: error.message || "Failed to create checkout session" }, { status: 500 })
  }
}
