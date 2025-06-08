"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { XCircle } from "lucide-react"

export default function BillingCancelPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <XCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
          <CardTitle className="mt-4 text-2xl font-extrabold text-gray-900">Payment Canceled</CardTitle>
          <CardDescription className="mt-2 text-sm text-gray-600">
            Your payment process was canceled. You have not been charged.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            If you encountered any issues or have questions, please contact support.
          </p>
          <div className="mt-6">
            <Button asChild className="w-full">
              <Link href="/billing">Try Again</Link>
            </Button>
          </div>
          <div className="mt-4">
            <Button variant="link" asChild>
              <Link href="/">Go to Homepage</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
