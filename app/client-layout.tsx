"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { GoalDataProvider } from "@/contexts/goal-data-context"
import { SiteHeader } from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLandingPage = pathname === "/"

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <GoalDataProvider>
          <div className="relative flex min-h-screen flex-col bg-background antialiased">
            <SiteHeader variant={isLandingPage ? "landing" : "default"} />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
          <Toaster />
        </GoalDataProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
