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
  console.error("Stripe secret key is not set.")
}

export async function POST(req: Request) {
  if (!stripeSecretKey || !stripe) {
    return NextResponse.json({ error: "Stripe configuration missing." }, { status: 500 })
  }

  try {
    const { userId, email, name } = await req.json()

    if (!userId || !email) {
      return NextResponse.json({ error: "User ID and email are required" }, { status: 400 })
    }

    // Check if customer already exists
    const { data: existingCustomer } = await supabase()
      .from("customers")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single()

    if (existingCustomer?.stripe_customer_id) {
      return NextResponse.json({
        message: "Stripe customer already exists",
        stripeCustomerId: existingCustomer.stripe_customer_id,
      })
    }

    // Create a new customer in Stripe
    const customer = await stripe.customers.create({
      email: email,
      name: name,
      metadata: {
        supabase_user_id: userId,
      },
    })

    if (!customer) {
      throw new Error("Failed to create Stripe customer.")
    }

    // Store the Stripe customer ID in Supabase
    const { error: dbError } = await supabase().from("customers").insert({
      id: userId,
      stripe_customer_id: customer.id,
    })

    if (dbError) {
      console.error("Error saving Stripe customer ID to Supabase:", dbError)
      // Clean up the Stripe customer if database insert fails
      try {
        await stripe.customers.del(customer.id)
      } catch (cleanupError) {
        console.error("Failed to cleanup Stripe customer:", cleanupError)
      }
      throw new Error(`Failed to save Stripe customer ID to database: ${dbError.message}`)
    }

    return NextResponse.json({
      message: "Stripe customer created and linked successfully",
      stripeCustomerId: customer.id,
    })
  } catch (error: any) {
    console.error("Error in /api/create-stripe-customer:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
