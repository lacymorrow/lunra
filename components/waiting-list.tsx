"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { joinWaitingList } from "@/app/actions"
import { Sparkles, CheckCircle, AlertCircle } from "lucide-react"

export function WaitingList() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setResult(null)

    const formData = new FormData()
    formData.append("email", email)

    const response = await joinWaitingList(formData)
    setResult(response)
    setIsSubmitting(false)

    if (response.success) {
      setEmail("")
    }
  }

  return (
    <section className="py-24 px-6 bg-gradient-to-r from-rose-50 to-amber-50">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-400 to-amber-300 rounded-full mb-8">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-4xl font-serif text-stone-800 mb-6">join our waiting list</h2>
        <p className="text-xl text-stone-600 font-light mb-10 max-w-2xl mx-auto">
          Be among the first to experience our mindful approach to goal planning. We'll notify you when we're ready to
          welcome you.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto mb-8">
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-full border-stone-200 focus-visible:ring-rose-400 py-6 px-6"
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-rose-400 hover:bg-rose-500 text-white rounded-full py-6"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Joining...
              </>
            ) : (
              "Join Waitlist"
            )}
          </Button>
        </form>

        {result && (
          <div
            className={`flex items-center justify-center gap-2 text-sm ${
              result.success ? "text-sage-600" : "text-rose-600"
            }`}
          >
            {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{result.message}</span>
          </div>
        )}

        <p className="text-stone-500 text-sm mt-8 font-light">
          We respect your privacy and will never share your information.
        </p>
      </div>
    </section>
  )
}
