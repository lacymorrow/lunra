import { NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from "@/lib/supabase" // Uses server client

// Ensure STRIPE_SECRET_KEY is available
const stripeSecretKey = process.env.STRIPE
if (!stripeSecretKey) {
  console.error("Stripe secret key is not set.")
  // Optionally, throw an error or handle this case as critical
}

const stripe = new Stripe(stripeSecretKey as string, {
  apiVersion: "2024-04-10", // Use the latest API version
})

export async function POST(req: Request) {
  try {
    const { userId, email, name } = await req.json()

    if (!userId || !email) {
      return NextResponse.json({ error: "User ID and email are required" }, { status: 400 })
    }

    // 1. Create a new customer in Stripe
    const customer = await stripe.customers.create({
      email: email,
      name: name, // Optional: pass user's name if available
      metadata: {
        supabase_user_id: userId, // Link Stripe customer to Supabase user
      },
    })

    if (!customer) {
      throw new Error("Failed to create Stripe customer.")
    }

    // 2. Store the Stripe customer ID in your Supabase `customers` table
    const { error: dbError } = await supabase().from("customers").insert({
      id: userId, // This is the Supabase user ID
      stripe_customer_id: customer.id,
    })

    if (dbError) {
      console.error("Error saving Stripe customer ID to Supabase:", dbError)
      // Potentially, you might want to delete the Stripe customer if DB insert fails
      // await stripe.customers.del(customer.id); // Or handle this with a retry mechanism
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
