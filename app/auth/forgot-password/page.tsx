"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Moon, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error } = await resetPassword(email)

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#faf8f5" }}>
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
            <CardTitle className="text-2xl font-serif text-stone-800">Reset your password</CardTitle>
            <CardDescription className="text-stone-600 font-light">
              We'll send you a link to reset your password
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
                  <p className="text-sm text-sage-700 font-medium">Check your email</p>
                  <p className="text-sm text-sage-600 font-light">
                    We've sent you a password reset link. Please check your inbox.
                  </p>
                </div>
              </div>
            )}

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

              <Button
                type="submit"
                className="w-full rounded-full bg-rose-400 hover:bg-rose-500 text-white py-6"
                disabled={isLoading || success}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending reset link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/auth/signin" className="text-rose-500 hover:text-rose-600 inline-flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
