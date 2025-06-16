"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"

interface PricingButtonProps {
  planId: "seedling" | "bloom"
  children: React.ReactNode
  className?: string
  variant?: "default" | "outline"
}

declare global {
  interface Window {
    Stripe: any
  }
}

export function PricingButton({ planId, children, className, variant }: PricingButtonProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  // Safely check for auth context without throwing error
  const { user, isLoading } = useAuth()

  const handleClick = async () => {
    if (isLoading) return

    // If no user, redirect to signup
    if (!user) {
      router.push("/auth/signup")
      return
    }

    // If seedling plan, redirect to dashboard (free plan)
    if (planId === "seedling") {
      router.push("/dashboard")
      return
    }

    // For bloom plan, start Stripe checkout
    if (!window.Stripe) {
      toast({
        title: "Error",
        description: "Payment system is loading. Please try again in a moment.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      })

      const { sessionId, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      const stripe = window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      })

      if (stripeError) {
        throw new Error(stripeError.message)
      }
    } catch (error) {
      console.error("Error starting checkout:", error)
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={isLoading || isProcessing} className={className} variant={variant}>
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        children
      )}
    </Button>
  )
}
