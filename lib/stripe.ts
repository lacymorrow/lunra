import Stripe from "stripe"
import { loadStripe, Stripe as StripeJS } from "@stripe/stripe-js"

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
  typescript: true,
})

// Client-side Stripe instance
let stripePromise: Promise<StripeJS | null>
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

// Plan configuration matching your pricing
export const STRIPE_PLANS = {
  seedling: {
    name: "Seedling",
    price: 0,
    priceId: null, // Free plan
    features: [
      "3 cherished goals",
      "gentle AI guidance", 
      "weekly reflections",
      "progress celebration",
      "mobile companion",
    ],
    limits: {
      goals: 3,
      aiRequests: 50, // per month
    },
  },
  bloom: {
    name: "Bloom", 
    price: 900, // $9.00 in cents
    priceId: process.env.STRIPE_BLOOM_PRICE_ID!,
    features: [
      "unlimited aspirations",
      "advanced AI mentorship",
      "custom timelines", 
      "detailed insights",
      "community connection",
      "priority care",
    ],
    limits: {
      goals: -1, // unlimited
      aiRequests: 500, // per month
    },
  },
  garden: {
    name: "Garden",
    price: 1900, // $19.00 in cents  
    priceId: process.env.STRIPE_GARDEN_PRICE_ID!,
    features: [
      "everything in Bloom",
      "collaborative spaces",
      "team insights",
      "shared celebrations", 
      "custom integrations",
      "dedicated support",
    ],
    limits: {
      goals: -1, // unlimited
      aiRequests: 2000, // per month
    },
  },
} as const

export type PlanType = keyof typeof STRIPE_PLANS

// Helper function to get plan details
export function getPlanDetails(planType: PlanType) {
  return STRIPE_PLANS[planType]
}

// Helper function to format price
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100)
}