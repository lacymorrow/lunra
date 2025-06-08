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
import { useAuth } from "@/contexts/auth-context";
import { useSubscription } from "@/hooks/use-subscription";
import { Crown, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

interface SubscriptionGateProps {
  children: ReactNode;
  feature?: string;
  showUpgrade?: boolean;
}

export function SubscriptionGate({
  children,
  feature = "premium feature",
  showUpgrade = true,
}: SubscriptionGateProps) {
  const { user } = useAuth();
  const { hasActiveSubscription, isLoading } = useSubscription();
  const router = useRouter();

  // If not logged in, show sign in prompt
  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <CardTitle>Sign In Required</CardTitle>
          <CardDescription>Please sign in to access {feature}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            className="w-full"
            onClick={() => router.push("/auth/signin")}
          >
            Sign In
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // If loading subscription status
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user has active subscription, show the content
  if (hasActiveSubscription) {
    return <>{children}</>;
  }

  // If no subscription and showUpgrade is false, show nothing
  if (!showUpgrade) {
    return null;
  }

  // Show upgrade prompt
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <Crown className="h-12 w-12 mx-auto text-yellow-500 mb-2" />
        <CardTitle>Premium Feature</CardTitle>
        <CardDescription>
          Upgrade to Bloom to access {feature} and unlock your full potential
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
            <span>Unlimited aspirations</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
            <span>Advanced AI mentorship</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
            <span>Custom timelines & insights</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
            <span>Priority support</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={() => router.push("/billing")}>
          Upgrade to Bloom
        </Button>
      </CardFooter>
    </Card>
  );
}
