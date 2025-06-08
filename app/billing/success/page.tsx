"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export default function BillingSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
          </div>
          <CardTitle className="mt-4 text-2xl font-extrabold text-gray-900">Payment Successful!</CardTitle>
          <CardDescription className="mt-2 text-sm text-gray-600">
            Thank you for your subscription. Your payment was processed successfully.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessionId && <p className="text-xs text-gray-500 mt-2">Checkout Session ID: {sessionId}</p>}
          <div className="mt-6">
            <Button asChild className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
          <div className="mt-4">
            <Button variant="link" asChild>
              <Link href="/billing">View Billing Options</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
