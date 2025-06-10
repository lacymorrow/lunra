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
import { useToast } from "@/hooks/use-toast";
import { PLANS } from "@/lib/stripe-config";
import { CheckCircle, Crown, Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

declare global {
  interface Window {
    Stripe: any;
  }
}

export default function BillingPage() {
  const { user, userProfile, subscription, isLoading, refreshProfile } =
    useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push("/auth/signin");
    return null;
  }

  const currentPlan = userProfile?.plan_id || "seedling";
  const isBloomPlan = currentPlan === "bloom";

  const handleUpgrade = async () => {
    if (!window.Stripe) {
      toast({
        title: "Error",
        description: "Stripe is not loaded. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    setIsUpgrading(true);
    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId: "bloom" }),
      });

      const { sessionId, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      const stripe = window.Stripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      );
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsLoadingPortal(true);
    try {
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
      });

      const { url, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      window.location.href = url;
    } catch (error) {
      console.error("Error creating portal session:", error);
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const handleSyncSubscription = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/stripe/sync-subscription", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to sync subscription");
      }

      toast({
        title: "Subscription Synced",
        description: `Your ${result.plan} plan is now up to date!`,
      });

      // Refresh the profile data instead of reloading the page
      await refreshProfile();
    } catch (error) {
      console.error("Error syncing subscription:", error);
      toast({
        title: "Sync Failed",
        description: "Could not sync subscription. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-stone-800 mb-2">
          Billing & Subscription
        </h1>
        <p className="text-stone-600">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Current Plan */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Current Plan
                {isBloomPlan && <Crown className="h-5 w-5 text-amber-500" />}
              </CardTitle>
              <CardDescription>
                You're currently on the {PLANS[currentPlan].name} plan
              </CardDescription>
            </div>
            <Badge variant={isBloomPlan ? "default" : "secondary"}>
              {PLANS[currentPlan].name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-2xl font-serif text-stone-800">
                ${PLANS[currentPlan].price}
                <span className="text-base font-normal text-stone-600">
                  {PLANS[currentPlan].price > 0 ? "/month" : " forever"}
                </span>
              </p>
            </div>

            {subscription && (
              <div className="space-y-2 text-sm text-stone-600">
                <p>
                  Status: <Badge variant="outline">{subscription.status}</Badge>
                </p>
                {subscription.current_period_end && (
                  <p>
                    {subscription.cancel_at_period_end ? "Cancels" : "Renews"}{" "}
                    on:{" "}
                    {new Date(
                      subscription.current_period_end
                    ).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-4">
              {!isBloomPlan && (
                <Button
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className="bg-rose-400 hover:bg-rose-500"
                >
                  {isUpgrading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Upgrade to Bloom"
                  )}
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleSyncSubscription}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Status
                  </>
                )}
              </Button>

              {subscription && (
                <Button
                  variant="outline"
                  onClick={handleManageBilling}
                  disabled={isLoadingPortal}
                >
                  {isLoadingPortal ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Manage Billing"
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(PLANS).map(([planId, plan]) => (
          <Card
            key={planId}
            className={`${
              currentPlan === planId ? "ring-2 ring-rose-300" : ""
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {plan.name}
                  {planId === "bloom" && (
                    <Crown className="h-5 w-5 text-amber-500" />
                  )}
                  {currentPlan === planId && <Badge>Current</Badge>}
                </CardTitle>
              </div>
              <div>
                <span className="text-3xl font-serif text-stone-800">
                  ${plan.price}
                </span>
                <span className="text-stone-600">
                  {plan.price > 0 ? "/month" : " forever"}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-sage-500 flex-shrink-0" />
                    <span className="text-sm text-stone-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
