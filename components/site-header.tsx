"use client"

import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { useState } from "react"

interface SiteHeaderProps {
  variant?: "default" | "landing"
}

export function SiteHeader({ variant = "default" }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isLanding = variant === "landing"

  return (
    <header className="border-b border-stone-200 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <Logo size="lg" href="/" />

          {isLanding ? (
            // Landing page navigation
            <>
              <div className="hidden md:flex items-center space-x-10">
                <a href="#features" className="text-stone-600 hover:text-stone-800 transition-colors font-light">
                  Features
                </a>
                <a href="#how-it-works" className="text-stone-600 hover:text-stone-800 transition-colors font-light">
                  How it Works
                </a>
                <a href="#testimonials" className="text-stone-600 hover:text-stone-800 transition-colors font-light">
                  Stories
                </a>
                <a href="#pricing" className="text-stone-600 hover:text-stone-800 transition-colors font-light">
                  Pricing
                </a>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" className="hidden text-stone-600 hover:text-stone-800">
                  Sign In
                </Button>
                <Link href="/dashboard">
                  <Button className="bg-rose-400 hover:bg-rose-500 text-white border-0 rounded-full px-6">
                    Begin Your Journey
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            // App navigation
            <>
              <div className="hidden md:flex items-center space-x-8">
                <Link href="/dashboard" className="text-stone-600 hover:text-stone-800 transition-colors font-light">
                  Dashboard
                </Link>
                <Link href="/create-goal" className="text-stone-600 hover:text-stone-800 transition-colors font-light">
                  Create Goal
                </Link>
                <Link href="/timeline" className="text-stone-600 hover:text-stone-800 transition-colors font-light">
                  Timeline
                </Link>
                <Link href="/calendar" className="text-stone-600 hover:text-stone-800 transition-colors font-light">
                  Calendar
                </Link>
                <Link href="/check-in" className="text-stone-600 hover:text-stone-800 transition-colors font-light">
                  Check-in
                </Link>
                <Link href="/analytics" className="text-stone-600 hover:text-stone-800 transition-colors font-light">
                  Analytics
                </Link>
              </div>

              <div className="flex items-center space-x-4">
                <Button variant="ghost" className="hidden">
                  Account
                </Button>
                <Link href="/create-goal">
                  <Button className="bg-rose-400 hover:bg-rose-500 text-white border-0 rounded-full px-6 hidden md:flex">
                    New Goal
                  </Button>
                </Link>
              </div>
            </>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-stone-100 px-6 py-4">
          <nav className="flex flex-col space-y-4">
            {isLanding ? (
              // Landing mobile menu
              <>
                <a
                  href="#features"
                  className="text-stone-800 py-2 px-4 rounded-lg hover:bg-stone-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="text-stone-800 py-2 px-4 rounded-lg hover:bg-stone-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How it Works
                </a>
                <a
                  href="#testimonials"
                  className="text-stone-800 py-2 px-4 rounded-lg hover:bg-stone-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Stories
                </a>
                <a
                  href="#pricing"
                  className="text-stone-800 py-2 px-4 rounded-lg hover:bg-stone-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </a>
                <div className="pt-2 border-t border-stone-100">
                  <Link href="/dashboard">
                    <Button className="w-full bg-rose-400 hover:bg-rose-500 text-white rounded-full">
                      Begin Your Journey
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              // App mobile menu
              <>
                <Link
                  href="/dashboard"
                  className="text-stone-800 py-2 px-4 rounded-lg hover:bg-stone-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/create-goal"
                  className="text-stone-800 py-2 px-4 rounded-lg hover:bg-stone-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Create Goal
                </Link>
                <Link
                  href="/timeline"
                  className="text-stone-800 py-2 px-4 rounded-lg hover:bg-stone-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Timeline
                </Link>
                <Link
                  href="/calendar"
                  className="text-stone-800 py-2 px-4 rounded-lg hover:bg-stone-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Calendar
                </Link>
                <Link
                  href="/check-in"
                  className="text-stone-800 py-2 px-4 rounded-lg hover:bg-stone-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Check-in
                </Link>
                <Link
                  href="/analytics"
                  className="text-stone-800 py-2 px-4 rounded-lg hover:bg-stone-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Analytics
                </Link>
                <div className="pt-2 border-t border-stone-100">
                  <Button className="w-full bg-rose-400 hover:bg-rose-500 text-white rounded-full">New Goal</Button>
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
