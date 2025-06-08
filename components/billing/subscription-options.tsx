"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context" // Re-add for future use, but handle if user is null

interface StripeProduct {
  id: string
  name: string
  description: string | null
  images: string[]
  price: {
    id: string
    amount: number | null
    currency: string
    type: "recurring" | "one_time"
    interval?: "day" | "week" | "month" | "year"
    interval_count?: number
  }
}

export function SubscriptionOptions() {
  const [products, setProducts] = useState<StripeProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingCheckout, setIsLoadingCheckout] = useState<string | null>(null) // To show loading on specific button
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth() // Get user context

  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/get-stripe-products")
        if (!response.ok) {
          const errData = await response.json()
          throw new Error(errData.error || "Failed to fetch products")
        }
        const data: StripeProduct[] = await response.json()
        setProducts(data)
      } catch (err: any) {
        setError(err.message)
        console.error("Failed to load products:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const handleSubscribe = async (priceId: string) => {
    setIsLoadingCheckout(priceId)
    try {
      // Pass userId if available, otherwise it will be undefined/null
      // The API route will handle cases where userId is not present (unauthenticated flow)
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, userId: user?.id }), // Send user.id if user exists
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || "Failed to create checkout session.")
      }

      const session = await response.json()
      if (session.url) {
        window.location.href = session.url
      } else {
        alert("Error: Could not retrieve checkout session URL.")
      }
    } catch (err: any) {
      console.error("Subscription error:", err)
      alert(`Error: ${err.message}`)
    } finally {
      setIsLoadingCheckout(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p>Loading subscription options...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        <p>Error loading subscription options: {error}</p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center p-4">
        <p>No subscription plans available at the moment. Please check back later.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-3xl font-bold text-center mb-8">Choose Your Plan</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="flex flex-col">
            <CardHeader>
              {product.images && product.images[0] && (
                <img
                  src={product.images[0] || "/placeholder.svg?width=300&height=200&query=Product+Image"}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-t-md mb-4"
                />
              )}
              <CardTitle>{product.name}</CardTitle>
              {product.description && <CardDescription>{product.description}</CardDescription>}
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-2xl font-semibold">
                {product.price.amount !== null
                  ? `${(product.price.amount / 100).toFixed(2)} ${product.price.currency.toUpperCase()}`
                  : "Contact us"}
                {product.price.type === "recurring" && product.price.interval && (
                  <span className="text-sm font-normal">
                    {" "}
                    /{" "}
                    {product.price.interval_count && product.price.interval_count > 1
                      ? product.price.interval_count
                      : ""}{" "}
                    {product.price.interval}
                  </span>
                )}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleSubscribe(product.price.id)}
                disabled={isLoadingCheckout === product.price.id}
              >
                {isLoadingCheckout === product.price.id ? "Processing..." : "Subscribe"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
