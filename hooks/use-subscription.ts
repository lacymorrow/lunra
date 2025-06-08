"use client"

import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"

interface Subscription {
    id: string
    status: string
    price_id: string
    cancel_at_period_end: boolean
    current_period_end: string
    trial_end: string | null
}

export function useSubscription() {
    const { user } = useAuth()
    const [subscription, setSubscription] = useState<Subscription | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchSubscription() {
            if (!user) {
                setSubscription(null)
                setIsLoading(false)
                return
            }

            try {
                setIsLoading(true)
                setError(null)

                const response = await fetch("/api/subscription/status")
                if (!response.ok) {
                    throw new Error("Failed to fetch subscription status")
                }

                const data = await response.json()
                setSubscription(data.subscription)
            } catch (err: any) {
                console.error("Error fetching subscription:", err)
                setError(err.message)
            } finally {
                setIsLoading(false)
            }
        }

        fetchSubscription()
    }, [user])

    const hasActiveSubscription = subscription &&
        (subscription.status === "active" || subscription.status === "trialing")

    const isTrialing = subscription?.status === "trialing"

    const isCanceled = subscription?.cancel_at_period_end === true

    return {
        subscription,
        hasActiveSubscription,
        isTrialing,
        isCanceled,
        isLoading,
        error,
        refetch: () => {
            if (user) {
                fetchSubscription()
            }
        }
    }
}
