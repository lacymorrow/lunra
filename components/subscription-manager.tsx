"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Sparkles, Crown, Users, AlertCircle } from "lucide-react"
import { useSubscription } from "@/contexts/subscription-context"
import { STRIPE_PLANS, formatPrice, type PlanType } from "@/lib/stripe"
import { useToast } from "@/hooks/use-toast"

export function SubscriptionManager() {
  const { subscription, usage, isLoading, createCheckoutSession } = useSubscription()
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null)
  const { toast } = useToast()

  const handleUpgrade = async (planType: PlanType) => {
    if (planType === "seedling") return // Can't "upgrade" to free
    
    setLoadingPlan(planType)
    try {
      await createCheckoutSession(planType)
    } catch (error) {
      console.error("Failed to create checkout session:", error)
      toast({
        title: "Payment Error",
        description: "Failed to start payment process. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingPlan(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-48 bg-stone-100 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 bg-stone-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const currentPlan = subscription?.planType || "seedling"
  const currentPlanDetails = STRIPE_PLANS[currentPlan]

  return (
    <div className="space-y-8">
      {/* Current Plan Overview */}
      <Card className="border-0 shadow-lg rounded-3xl bg-gradient-to-br from-rose-50 to-amber-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-serif text-stone-800 flex items-center">
                {currentPlan === "seedling" && <Sparkles className="h-6 w-6 mr-2 text-rose-400" />}
                {currentPlan === "bloom" && <Crown className="h-6 w-6 mr-2 text-amber-500" />}
                {currentPlan === "garden" && <Users className="h-6 w-6 mr-2 text-sage-500" />}
                {currentPlanDetails.name} Plan
              </CardTitle>
              <CardDescription className="text-stone-600 font-light">
                {currentPlan === "seedling" && "Perfect for nurturing your first dreams"}
                {currentPlan === "bloom" && "Flourishing with deeper support"}
                {currentPlan === "garden" && "Growing together as a team"}
              </CardDescription>
            </div>
            <Badge className={`rounded-full px-4 py-2 font-light ${
              currentPlan === "seedling" ? "bg-rose-100 text-rose-700" :
              currentPlan === "bloom" ? "bg-amber-100 text-amber-700" :
              "bg-sage-100 text-sage-700"
            }`}>
              {subscription?.status === "active" ? "Active" : subscription?.status || "Free"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Goals Usage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-stone-700">Goals Created</span>
                <span className="text-sm text-stone-600 font-light">
                  {usage?.goalsCreated || 0} / {usage?.goalsLimit === -1 ? "∞" : usage?.goalsLimit || 0}
                </span>
              </div>
              {usage?.goalsLimit !== -1 && (
                <Progress 
                  value={usage?.goalsLimit ? (usage.goalsCreated / usage.goalsLimit) * 100 : 0}
                  className="h-2"
                />
              )}
            </div>

            {/* AI Requests Usage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-stone-700">AI Requests This Month</span>
                <span className="text-sm text-stone-600 font-light">
                  {usage?.aiRequestsCount || 0} / {usage?.aiRequestsLimit === -1 ? "∞" : usage?.aiRequestsLimit || 0}
                </span>
              </div>
              {usage?.aiRequestsLimit !== -1 && (
                <Progress 
                  value={usage?.aiRequestsLimit ? (usage.aiRequestsCount / usage.aiRequestsLimit) * 100 : 0}
                  className="h-2"
                />
              )}
            </div>
          </div>

          {/* Usage Warnings */}
          {usage && usage.goalsLimit !== -1 && usage.goalsCreated >= usage.goalsLimit && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Goal Limit Reached</p>
                <p className="text-sm text-amber-700 font-light">
                  You've reached your goal limit. Upgrade to create unlimited goals.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Options */}
      <div>
        <h3 className="text-2xl font-serif text-stone-800 mb-6">Choose Your Journey</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.keys(STRIPE_PLANS) as PlanType[]).map((planType) => {
            const plan = STRIPE_PLANS[planType]
            const isCurrentPlan = planType === currentPlan
            const isUpgrade = planType !== "seedling" && (
              currentPlan === "seedling" || 
              (currentPlan === "bloom" && planType === "garden")
            )

            return (
              <Card 
                key={planType}
                className={`relative border-0 shadow-lg rounded-3xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 ${
                  isCurrentPlan ? "ring-2 ring-rose-300 bg-rose-50" : "bg-white"
                } ${planType === "bloom" ? "ring-2 ring-amber-300" : ""}`}
              >
                {planType === "bloom" && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-amber-400 text-white px-6 py-2 rounded-full font-light">
                      most cherished
                    </Badge>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4">
                    <Badge className="bg-rose-400 text-white px-4 py-2 rounded-full font-light">
                      current
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="mb-4">
                    {planType === "seedling" && <Sparkles className="h-8 w-8 mx-auto text-rose-400" />}
                    {planType === "bloom" && <Crown className="h-8 w-8 mx-auto text-amber-500" />}
                    {planType === "garden" && <Users className="h-8 w-8 mx-auto text-sage-500" />}
                  </div>
                  <CardTitle className="text-xl font-serif text-stone-800">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-3xl font-serif text-stone-800">
                      {plan.price === 0 ? "Free" : formatPrice(plan.price)}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-stone-600 font-light">/month</span>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="px-6 pb-6">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-sage-500 mr-3 flex-shrink-0" />
                        <span className="text-stone-700 font-light">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleUpgrade(planType)}
                    disabled={isCurrentPlan || loadingPlan === planType}
                    className={`w-full rounded-full font-light ${
                      planType === "bloom" || isUpgrade
                        ? "bg-rose-400 hover:bg-rose-500 text-white"
                        : "border-stone-300 text-stone-700 hover:bg-stone-50"
                    }`}
                    variant={planType === "bloom" || isUpgrade ? "default" : "outline"}
                  >
                    {loadingPlan === planType ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : isUpgrade ? (
                      `Upgrade to ${plan.name}`
                    ) : (
                      `Choose ${plan.name}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Billing Information */}
      {subscription?.stripeCustomerId && (
        <Card className="border-0 shadow-lg rounded-3xl">
          <CardHeader>
            <CardTitle className="text-xl font-serif text-stone-800">Billing Information</CardTitle>
            <CardDescription className="text-stone-600 font-light">
              Manage your subscription and billing details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscription.currentPeriodEnd && (
                <div>
                  <span className="text-sm font-medium text-stone-700">Next billing date:</span>
                  <span className="text-sm text-stone-600 font-light ml-2">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
              )}
              {subscription.cancelAtPeriodEnd && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm font-medium text-amber-800">Subscription Ending</p>
                  <p className="text-sm text-amber-700 font-light">
                    Your subscription will end on {new Date(subscription.currentPeriodEnd!).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}