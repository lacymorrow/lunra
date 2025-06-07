import { NextResponse } from "next/server"
import Stripe from "stripe"

// Ensure STRIPE_SECRET_KEY is available
const stripeSecretKey = process.env.STRIPE
if (!stripeSecretKey) {
  console.error("Stripe secret key is not set for /api/get-stripe-products.")
  // This API route will not function without the secret key.
}

const stripe = new Stripe(stripeSecretKey as string, {
  apiVersion: "2024-04-10",
})

export async function GET() {
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Stripe configuration missing." }, { status: 500 })
  }

  try {
    // Fetch active products from Stripe
    const products = await stripe.products.list({
      active: true,
      expand: ["data.default_price"], // Important: expand to get price details
    })

    // We are interested in products that have a default price and are intended for subscription/purchase
    const activeProductsWithPrices = products.data
      .filter((product) => product.default_price && (product.default_price as Stripe.Price).active)
      .map((product) => {
        const price = product.default_price as Stripe.Price
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          images: product.images,
          price: {
            id: price.id,
            amount: price.unit_amount, // Amount in cents
            currency: price.currency,
            type: price.type, // 'recurring' or 'one_time'
            interval: price.recurring?.interval, // 'month', 'year', etc. for recurring prices
            interval_count: price.recurring?.interval_count,
          },
        }
      })

    return NextResponse.json(activeProductsWithPrices)
  } catch (error: any) {
    console.error("Error fetching Stripe products:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch products" }, { status: 500 })
  }
}
