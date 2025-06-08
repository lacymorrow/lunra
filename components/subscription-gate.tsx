"use client";

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
import { Lock } from "lucide-react";
import { ReactNode } from "react";

interface SubscriptionGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  feature?: string;
}

export function SubscriptionGate({
  children,
  fallback,
  feature = "this feature",
}: SubscriptionGateProps) {
  const { hasActiveSubscription, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!hasActiveSubscription) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
            <Lock className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle>Premium Feature</CardTitle>
          <CardDescription>
            You need an active subscription to access {feature}.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <a href="/billing">Upgrade Now</a>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return <>{children}</>;
}

// Higher-order component version
export function withSubscriptionGate<P extends object>(
  Component: React.ComponentType<P>,
  feature?: string
) {
  return function SubscriptionGatedComponent(props: P) {
    return (
      <SubscriptionGate feature={feature}>
        <Component {...props} />
      </SubscriptionGate>
    );
  };
}
