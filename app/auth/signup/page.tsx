"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { AlertCircle, CheckCircle, Moon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data, error } = await signUp(email, password);

      if (error) {
        setError(error.message);
      } else {
        // Check if email confirmation is required
        if (!data.session) {
          setSuccess(true);
        }
        // If session exists, the user will be automatically redirected by the auth context
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#faf8f5" }}
    >
      <div className="w-full max-w-md px-6">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-300 to-amber-300 rounded-full flex items-center justify-center">
              <Moon className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-serif text-stone-800">lunra</span>
          </Link>
        </div>

        <Card className="border-0 rounded-3xl shadow-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-serif text-stone-800">
              Create an account
            </CardTitle>
            <CardDescription className="text-stone-600 font-light">
              Begin your journey with lunra
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start">
                <AlertCircle className="h-5 w-5 text-rose-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-sage-50 border border-sage-200 rounded-xl flex items-start">
                <CheckCircle className="h-5 w-5 text-sage-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-sage-700 font-medium">
                    Check your email
                  </p>
                  <p className="text-sm text-sage-600 font-light">
                    We've sent you a confirmation link. Please check your inbox
                    to verify your email.
                  </p>
                </div>
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-stone-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-xl border-stone-200 focus-visible:ring-rose-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-stone-700">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="rounded-xl border-stone-200 focus-visible:ring-rose-400"
                  />
                  <p className="text-xs text-stone-500 font-light">
                    Password must be at least 6 characters long
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-full bg-rose-400 hover:bg-rose-500 text-white py-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating account...
                    </>
                  ) : (
                    "Sign Up"
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-stone-600 font-light">
                Already have an account?{" "}
                <Link
                  href="/auth/signin"
                  className="text-rose-500 hover:text-rose-600"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
