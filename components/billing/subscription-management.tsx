"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSubscription } from "@/hooks/use-subscription";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

export function SubscriptionManagement() {
  const {
    subscription,
    hasActiveSubscription,
    isLoading,
    error,
    cancelSubscription,
    reactivateSubscription,
  } = useSubscription();
  const [isManaging, setIsManaging] = useState(false);

  const handleCancel = async () => {
    if (!subscription?.id) return;

    setIsManaging(true);
    const success = await cancelSubscription(subscription.id);
    if (success) {
      // Show success message
    }
    setIsManaging(false);
  };

  const handleReactivate = async () => {
    if (!subscription?.id) return;

    setIsManaging(true);
    const success = await reactivateSubscription(subscription.id);
    if (success) {
      // Show success message
    }
    setIsManaging(false);
  };

  const getStatusBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Canceling
        </Badge>
      );
    }

    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Active
          </Badge>
        );
      case "trialing":
        return <Badge variant="secondary">Trial</Badge>;
      case "past_due":
        return <Badge variant="destructive">Past Due</Badge>;
      case "canceled":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Canceled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Loading subscription details...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-500">Error loading subscription: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!hasActiveSubscription || !subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>
            You don't have an active subscription. Choose a plan to get started.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild>
            <a href="/billing">View Plans</a>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Current Subscription</CardTitle>
          {getStatusBadge(subscription.status, subscription.cancelAtPeriodEnd)}
        </div>
        <CardDescription>{subscription.price.products.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Price</p>
            <p className="text-lg font-semibold">
              ${(subscription.price.unit_amount / 100).toFixed(2)}{" "}
              {subscription.price.currency.toUpperCase()}
              <span className="text-sm font-normal text-muted-foreground">
                /
                {subscription.price.interval_count > 1
                  ? subscription.price.interval_count
                  : ""}{" "}
                {subscription.price.interval}
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <p className="text-lg">{subscription.status}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Current Period
            </p>
            <p className="text-sm">
              {format(new Date(subscription.currentPeriodStart), "MMM d, yyyy")}{" "}
              - {format(new Date(subscription.currentPeriodEnd), "MMM d, yyyy")}
            </p>
          </div>
          {subscription.trialEnd && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Trial Ends
              </p>
              <p className="text-sm">
                {format(new Date(subscription.trialEnd), "MMM d, yyyy")}
              </p>
            </div>
          )}
        </div>

        {subscription.cancelAtPeriodEnd && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              Your subscription will be canceled on{" "}
              {format(new Date(subscription.currentPeriodEnd), "MMM d, yyyy")}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        {subscription.cancelAtPeriodEnd ? (
          <Button
            onClick={handleReactivate}
            disabled={isManaging}
            variant="default"
          >
            {isManaging ? "Processing..." : "Reactivate Subscription"}
          </Button>
        ) : (
          <Button
            onClick={handleCancel}
            disabled={isManaging}
            variant="destructive"
          >
            {isManaging ? "Processing..." : "Cancel Subscription"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
