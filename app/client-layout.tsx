"use client"

import type React from "react"
import "./globals.css"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { AuthProvider } from "@/contexts/auth-context"
import { GoalDataProvider } from "@/contexts/goal-data-context"
import { Toaster } from "@/components/ui/toaster"
import { usePathname } from "next/navigation"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLandingPage = pathname === "/"

  return (
    <AuthProvider>
      <GoalDataProvider>
        <div className="relative flex min-h-screen flex-col">
          <SiteHeader variant={isLandingPage ? "landing" : "default"} />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </div>
        <Toaster />
      </GoalDataProvider>
    </AuthProvider>
  )
}
