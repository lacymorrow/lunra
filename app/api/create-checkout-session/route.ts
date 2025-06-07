import { NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from "@/lib/supabase" // We'll need this later for authenticated users

// Ensure STRIPE_SECRET_KEY is available
const stripeSecretKey = process.env.STRIPE
if (!stripeSecretKey) {
  console.error("Stripe secret key is not set for /api/create-checkout-session.")
}

const stripe = new Stripe(stripeSecretKey as string, {
  apiVersion: "2024-04-10",
})

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function POST(req: Request) {
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Stripe configuration missing." }, { status: 500 })
  }

  try {
    const { priceId, userId } = await req.json() // userId will be null for now

    if (!priceId) {
      return NextResponse.json({ error: "Price ID is required" }, { status: 400 })
    }

    let stripeCustomerId: string | undefined = undefined

    // If a userId is provided (i.e., user is logged in), try to get their Stripe Customer ID
    // For now, this block will likely not execute as we're testing unauthenticated.
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
        // Depending on your business logic, you might want to create a Stripe customer here if one doesn't exist,
        // or return an error. For now, we'll let Stripe create a guest customer or prompt for email.
      } else {
        stripeCustomerId = customerData.stripe_customer_id
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription", // Assuming all your products are subscription-based for now
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer: stripeCustomerId, // If undefined, Stripe will create a new guest customer or prompt for email
      // If customer is provided, Stripe might prefill email if 'customer_update' is not used.
      // For more control when customer ID is known:
      // customer_update: stripeCustomerId ? { address: 'auto' } : undefined, // Allows customer to update billing address
      success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing/cancel`,
      // To pass Supabase user ID through checkout to webhook (useful for linking subscription later)
      // This is more robust when user is authenticated.
      metadata: userId ? { supabase_user_id: userId } : undefined,
      // If you want to allow promotion codes:
      // allow_promotion_codes: true,
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
