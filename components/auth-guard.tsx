"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Define public routes that don't require authentication
    const publicRoutes = [
      "/",
      "/auth/signin",
      "/auth/signup",
      "/auth/forgot-password",
      "/auth/update-password",
      "/dashboard", // Allow dashboard access for demo mode
      "/create-goal", // Allow goal creation for demo mode
      "/goal/new/breakdown", // Allow goal breakdown for demo mode
      "/timeline", // Allow timeline viewing for demo mode
      "/calendar", // Allow calendar viewing for demo mode
      "/check-in", // Allow check-ins for demo mode
      "/analytics", // Allow analytics viewing for demo mode
    ]

    if (publicRoutes.includes(pathname)) {
      return
    }

    // For other routes, redirect to sign in if not authenticated
    if (!isLoading && !user) {
      router.push("/auth/signin")
    }
  }, [user, isLoading, router, pathname])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#faf8f5" }}>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-400 mb-4"></div>
          <p className="text-stone-600 font-light">Loading...</p>
        </div>
      </div>
    )
  }

  // For public routes or authenticated users, render children
  return <>{children}</>
}
