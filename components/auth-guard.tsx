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
    // Skip auth check for public routes
    const publicRoutes = ["/", "/auth/signin", "/auth/signup", "/auth/forgot-password", "/auth/update-password"]
    if (publicRoutes.includes(pathname)) {
      return
    }

    // If not loading and no user, redirect to sign in
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
