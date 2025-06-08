import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"

interface SubscriptionData {
    id: string
    status: string
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
    trialEnd: string | null
    price: {
        id: string
        unit_amount: number
        currency: string
        interval: string
        interval_count: number
        products: {
            id: string
            name: string
            description: string
        }
    }
}

interface UseSubscriptionReturn {
    subscription: SubscriptionData | null
    hasActiveSubscription: boolean
    isLoading: boolean
    error: string | null
    refetch: () => Promise<void>
    cancelSubscription: (subscriptionId: string) => Promise<boolean>
    reactivateSubscription: (subscriptionId: string) => Promise<boolean>
}

export function useSubscription(): UseSubscriptionReturn {
    const { user } = useAuth()
    const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
    const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchSubscription = async () => {
        if (!user?.id) {
            setIsLoading(false)
            return
        }

        try {
            setIsLoading(true)
            setError(null)

            const response = await fetch(`/api/subscription/status?userId=${user.id}`)

            if (!response.ok) {
                throw new Error("Failed to fetch subscription")
            }

            const data = await response.json()
            setSubscription(data.subscription)
            setHasActiveSubscription(data.hasActiveSubscription)
        } catch (err: any) {
            setError(err.message)
            console.error("Error fetching subscription:", err)
        } finally {
            setIsLoading(false)
        }
    }

    const cancelSubscription = async (subscriptionId: string): Promise<boolean> => {
        if (!user?.id) return false

        try {
            const response = await fetch("/api/subscription/manage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "cancel",
                    userId: user.id,
                    subscriptionId,
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to cancel subscription")
            }

            await fetchSubscription() // Refresh subscription data
            return true
        } catch (err: any) {
            setError(err.message)
            console.error("Error canceling subscription:", err)
            return false
        }
    }

    const reactivateSubscription = async (subscriptionId: string): Promise<boolean> => {
        if (!user?.id) return false

        try {
            const response = await fetch("/api/subscription/manage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "reactivate",
                    userId: user.id,
                    subscriptionId,
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to reactivate subscription")
            }

            await fetchSubscription() // Refresh subscription data
            return true
        } catch (err: any) {
            setError(err.message)
            console.error("Error reactivating subscription:", err)
            return false
        }
    }

    useEffect(() => {
        fetchSubscription()
    }, [user?.id])

    return {
        subscription,
        hasActiveSubscription,
        isLoading,
        error,
        refetch: fetchSubscription,
        cancelSubscription,
        reactivateSubscription,
    }
}
