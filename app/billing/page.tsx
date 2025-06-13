"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { PLANS } from "@/lib/stripe-config";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  CreditCard,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function BillingPage() {
  const {
    user,
    userProfile,
    userSubscription,
    isLoading,
    isDataLoading,
    refreshProfile,
  } = useAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-stone-600" />
          <span className="ml-2 text-stone-600">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    router.push("/auth/signin");
    return null;
  }

  const handleManageSubscription = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const errorData = await response.json();
        console.error("Failed to create portal session:", errorData);
        setError("Failed to access billing portal. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(
        "Failed to access billing portal. Please check your connection."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpgrade = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Double-check authentication before starting checkout
      if (!user) {
        router.push("/auth/signin");
        return;
      }

      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: "bloom",
        }),
      });

      if (response.ok) {
        const { sessionId } = await response.json();

        // Load Stripe and redirect to checkout
        if (typeof window !== "undefined" && window.Stripe) {
          const stripe = window.Stripe(
            process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
          );
          if (stripe) {
            const { error } = await stripe.redirectToCheckout({ sessionId });
            if (error) {
              console.error("Stripe redirect error:", error);
              setError("Failed to redirect to checkout. Please try again.");
            }
          } else {
            setError(
              "Payment system not available. Please refresh and try again."
            );
          }
        } else {
          setError("Payment system loading. Please refresh and try again.");
        }
      } else {
        const errorData = await response.json();
        console.error("Failed to create checkout session:", errorData);

        if (response.status === 401) {
          // Authentication issue - redirect to signin
          router.push("/auth/signin");
          return;
        }

        setError("Failed to start checkout. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to start checkout. Please check your connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSyncSubscription = async () => {
    setIsSyncing(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/sync-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Refresh the data after sync using auth context
        await refreshProfile();
      } else {
        if (response.status === 404) {
          setError("No subscription found to sync");
        } else {
          setError("Failed to sync subscription");
        }
      }
    } catch (error) {
      console.error("Error syncing subscription:", error);
      setError("Failed to sync subscription");
    } finally {
      setIsSyncing(false);
    }
  };

  // Show loading state while data is loading
  if (isDataLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-stone-600" />
          <span className="ml-2 text-stone-600">
            Loading subscription data...
          </span>
        </div>
      </div>
    );
  }

  // Determine current plan and subscription status
  const currentPlan = userProfile?.plan_id || "seedling";
  const planConfig = PLANS[currentPlan];
  const isActive = userSubscription?.status === "active";
  const isPaidPlan = currentPlan === "bloom";

  // Format subscription data
  const subscription = {
    status: userSubscription?.status || "inactive",
    plan: planConfig.name,
    price: isPaidPlan ? `$${planConfig.price}` : "Free",
    interval: isPaidPlan ? "month" : "",
    currentPeriodEnd: userSubscription?.current_period_end
      ? new Date(userSubscription.current_period_end).toLocaleDateString()
      : null,
    cancelAtPeriodEnd: userSubscription?.cancel_at_period_end || false,
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-stone-800 mb-2">
              Billing & Subscription
            </h1>
            <p className="text-stone-600">
              Manage your subscription and billing information
            </p>
          </div>
          <Button
            onClick={handleSyncSubscription}
            disabled={isSyncing}
            variant="outline"
            size="sm"
          >
            {isSyncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync Status
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Plan
            </CardTitle>
            <CardDescription>Your active subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg">
                {subscription.plan} Plan
              </span>
              <Badge
                variant={isActive && isPaidPlan ? "default" : "secondary"}
                className="capitalize"
              >
                {isActive && isPaidPlan ? (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {subscription.status}
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {subscription.status}
                  </div>
                )}
              </Badge>
            </div>

            <div className="space-y-2 text-sm text-stone-600">
              <div className="flex justify-between">
                <span>Price:</span>
                <span className="font-medium">
                  {subscription.price}
                  {subscription.interval && `/${subscription.interval}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Goals limit:</span>
                <span className="font-medium">
                  {planConfig.goalsLimit === -1
                    ? "Unlimited"
                    : planConfig.goalsLimit}
                </span>
              </div>
              {subscription.currentPeriodEnd && (
                <div className="flex justify-between">
                  <span>Next billing date:</span>
                  <span className="font-medium">
                    {subscription.currentPeriodEnd}
                  </span>
                </div>
              )}
              {subscription.cancelAtPeriodEnd && (
                <div className="flex items-center gap-1 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">
                    Cancels on {subscription.currentPeriodEnd}
                  </span>
                </div>
              )}
            </div>

            {isPaidPlan && userSubscription ? (
              <Button
                onClick={handleManageSubscription}
                disabled={isProcessing}
                className="w-full"
                variant="outline"
              >
                {isProcessing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Manage Subscription
              </Button>
            ) : (
              <Button
                onClick={handleUpgrade}
                disabled={isProcessing}
                className="w-full bg-rose-400 hover:bg-rose-500"
              >
                {isProcessing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Upgrade to Bloom
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Plan Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Plan Features
            </CardTitle>
            <CardDescription>What's included in your plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {planConfig.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {!isPaidPlan && (
              <Button
                onClick={handleUpgrade}
                disabled={isProcessing}
                className="w-full mt-4 bg-rose-400 hover:bg-rose-500"
              >
                {isProcessing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Upgrade Now
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Billing History - Only show for paid plans */}
      {isPaidPlan && userSubscription && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>Your recent invoices and payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-stone-500">
              <p>Billing history is managed through Stripe.</p>
              <Button
                onClick={handleManageSubscription}
                variant="ghost"
                className="mt-2"
                disabled={isProcessing}
              >
                View Billing History
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
