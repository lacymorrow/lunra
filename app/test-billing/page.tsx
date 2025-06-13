"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";

export default function TestBillingPage() {
  const {
    user,
    userProfile,
    userSubscription,
    isLoading,
    refreshProfile,
    signIn,
  } = useAuth();
  const [testResult, setTestResult] = useState<string>("");
  const [authTestResult, setAuthTestResult] = useState<string>("");
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");

  const testCheckoutSession = async () => {
    try {
      setTestResult("Testing checkout session creation...");

      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: "bloom",
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setTestResult(`✅ Checkout session created: ${result.sessionId}`);
      } else {
        setTestResult(
          `❌ Error: ${result.error} (Status: ${response.status})\nDetails: ${
            result.details || "No details"
          }`
        );
      }
    } catch (error) {
      setTestResult(`❌ Network error: ${error}`);
    }
  };

  const testAuthentication = async () => {
    try {
      setAuthTestResult("Testing authentication status...");

      const response = await fetch("/api/dev/test-auth");
      const result = await response.json();

      if (response.ok) {
        setAuthTestResult(
          `✅ Auth test results:\n${JSON.stringify(result, null, 2)}`
        );
      } else {
        setAuthTestResult(`❌ Auth test failed: ${result.error}`);
      }
    } catch (error) {
      setAuthTestResult(`❌ Network error: ${error}`);
    }
  };

  const handleSignIn = async () => {
    try {
      setAuthTestResult("Attempting to sign in...");
      const { error } = await signIn(email, password);

      if (error) {
        setAuthTestResult(`❌ Sign in failed: ${error.message}`);
      } else {
        setAuthTestResult("✅ Sign in successful! Refreshing profile...");
        await refreshProfile();
      }
    } catch (error) {
      setAuthTestResult(`❌ Sign in error: ${error}`);
    }
  };

  if (isLoading) {
    return <div>Loading auth...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Billing Test Page</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>User:</strong> {user ? user.email : "Not authenticated"}
              </p>
              <p>
                <strong>User ID:</strong> {user?.id || "N/A"}
              </p>
              <p>
                <strong>Profile Plan:</strong>{" "}
                {userProfile?.plan_id || "No profile"}
              </p>
              <p>
                <strong>Goals Limit:</strong>{" "}
                {userProfile?.goals_limit || "N/A"}
              </p>
              <p>
                <strong>Subscription Status:</strong>{" "}
                {userSubscription?.status || "No subscription"}
              </p>
            </div>
          </CardContent>
        </Card>

        {!user && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Sign In</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button onClick={handleSignIn} className="w-full">
                  Test Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Authentication Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={testAuthentication}
                variant="outline"
                className="w-full"
              >
                Test Server-Side Auth
              </Button>

              <Button
                onClick={refreshProfile}
                variant="outline"
                className="w-full"
              >
                Refresh Profile Data
              </Button>

              {authTestResult && (
                <div className="p-3 bg-gray-50 rounded border">
                  <pre className="text-sm whitespace-pre-wrap">
                    {authTestResult}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Flow Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={testCheckoutSession}
                disabled={!user}
                className="w-full"
              >
                Test Checkout Session Creation
              </Button>

              {testResult && (
                <div className="p-3 bg-gray-50 rounded border">
                  <pre className="text-sm whitespace-pre-wrap">
                    {testResult}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {!user ? (
                <>
                  <Button asChild variant="outline" className="w-full">
                    <a href="/auth/signin">Sign In Page</a>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <a href="/auth/signup">Sign Up Page</a>
                  </Button>
                </>
              ) : (
                <Button asChild className="w-full">
                  <a href="/billing">Go to Billing Page</a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
