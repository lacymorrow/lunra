"use client"

import type React from "react"

import { AuthProvider } from "@/contexts/auth-context"
import { GoalDataProvider } from "@/contexts/goal-data-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <GoalDataProvider>
          {children}
          <Toaster />
          <Sonner />
        </GoalDataProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
