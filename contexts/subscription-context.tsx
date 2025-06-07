"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"
import { 
  getUserSubscription, 
  getUserUsage, 
  initializeUserSubscription,
  type UserSubscription,
  type UserUsage
} from "@/lib/services/subscriptions"
import { getStripe } from "@/lib/stripe"
import type { PlanType } from "@/lib/stripe"

type SubscriptionContextType = {
  subscription: UserSubscription | null
  usage: UserUsage | null
  isLoading: boolean
  createCheckoutSession: (planType: PlanType) => Promise<void>
  refreshSubscription: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [usage, setUsage] = useState<UserUsage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user, session } = useAuth()

  const refreshSubscription = async () => {
    if (!user) {
      setSubscription(null)
      setUsage(null)
      return
    }

    try {
      const [subscriptionData, usageData] = await Promise.all([
        getUserSubscription(user.id),
        getUserUsage(user.id)
      ])

      // If no subscription exists, initialize with free plan
      if (!subscriptionData) {
        await initializeUserSubscription(user.id)
        const [newSubscription, newUsage] = await Promise.all([
          getUserSubscription(user.id),
          getUserUsage(user.id)
        ])
        setSubscription(newSubscription)
        setUsage(newUsage)
      } else {
        setSubscription(subscriptionData)
        setUsage(usageData)
      }
    } catch (error) {
      console.error("Error refreshing subscription:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const createCheckoutSession = async (planType: PlanType) => {
    if (!session?.access_token) {
      throw new Error("Not authenticated")
    }

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ planType }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session")
      }

      const stripe = await getStripe()
      if (!stripe) {
        throw new Error("Stripe not loaded")
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      })

      if (error) {
        throw error
      }
    } catch (error) {
      console.error("Error creating checkout session:", error)
      throw error
    }
  }

  useEffect(() => {
    if (user) {
      refreshSubscription()
    } else {
      setSubscription(null)
      setUsage(null)
      setIsLoading(false)
    }
  }, [user])

  const value = {
    subscription,
    usage,
    isLoading,
    createCheckoutSession,
    refreshSubscription,
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider")
  }
  return context
}