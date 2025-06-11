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
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  CreditCard,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function BillingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  if (!user) {
    router.push("/auth/signin");
    return null;
  }

  const handleManageSubscription = async () => {
    setIsLoading(true);
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
        console.error("Failed to create portal session");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: "price_1234567890", // Replace with your actual price ID
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        console.error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock subscription data - in a real app, you'd fetch this from your backend
  const subscription = {
    status: "active", // "active", "inactive", "canceled", "past_due"
    plan: "Pro",
    price: "$9.99",
    interval: "month",
    currentPeriodEnd: "2024-02-15",
    cancelAtPeriodEnd: false,
  };

  const isActive = subscription.status === "active";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800 mb-2">
          Billing & Subscription
        </h1>
        <p className="text-stone-600">
          Manage your subscription and billing information
        </p>
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
                variant={isActive ? "default" : "secondary"}
                className="capitalize"
              >
                {isActive ? (
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
                  {subscription.price}/{subscription.interval}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Next billing date:</span>
                <span className="font-medium">
                  {subscription.currentPeriodEnd}
                </span>
              </div>
              {subscription.cancelAtPeriodEnd && (
                <div className="flex items-center gap-1 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">
                    Cancels on {subscription.currentPeriodEnd}
                  </span>
                </div>
              )}
            </div>

            <Button
              onClick={handleManageSubscription}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Manage Subscription
            </Button>
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
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Unlimited goals</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">AI-powered goal breakdown</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Progress tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Calendar integration</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Check-in coaching</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Cloud sync</span>
              </div>
            </div>

            {!isActive && (
              <Button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="w-full mt-4 bg-rose-400 hover:bg-rose-500"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upgrade Now
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Billing History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Your recent invoices and payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-stone-100">
              <div>
                <div className="font-medium">Pro Plan - January 2024</div>
                <div className="text-sm text-stone-500">
                  Paid on Jan 15, 2024
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">$9.99</div>
                <Badge variant="outline" className="text-xs">
                  Paid
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-stone-100">
              <div>
                <div className="font-medium">Pro Plan - December 2023</div>
                <div className="text-sm text-stone-500">
                  Paid on Dec 15, 2023
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">$9.99</div>
                <Badge variant="outline" className="text-xs">
                  Paid
                </Badge>
              </div>
            </div>
          </div>

          <Button
            onClick={handleManageSubscription}
            variant="ghost"
            className="w-full mt-4"
            disabled={isLoading}
          >
            View All Invoices
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
