"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { useGoalData } from "@/contexts/goal-data-context";
import {
  AlertTriangle,
  CheckCircle,
  Cloud,
  CloudOff,
  CreditCard,
  LogOut,
  Menu,
  Moon,
  RefreshCw,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface SiteHeaderProps {
  variant?: "default" | "landing";
}

export function SiteHeader({ variant = "default" }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, userProfile, signOut, isSupabaseAvailable } = useAuth();
  const { goals, syncStatus } = useGoalData();

  const hasLocalData = goals.length > 0;
  const localDataCount = goals.length;
  const isLanding = variant === "landing";

  const handleSignOut = async () => {
    await signOut();
  };

  // Sync status indicator component
  const SyncStatusIndicator = () => {
    if (isLanding || !user) {
      if (hasLocalData) {
        return (
          <div className="flex items-center gap-1">
            <CloudOff className="h-4 w-4 text-amber-500" />
            <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
              {localDataCount} Local
            </Badge>
          </div>
        );
      }
      return null;
    }

    const isPaidUser = user && userProfile?.plan_id === "bloom";

    if (isPaidUser) {
      if (syncStatus.isLoading) {
        return (
          <div className="flex items-center gap-1">
            <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
            <Badge variant="default" className="text-xs hidden sm:inline-flex">
              Syncing...
            </Badge>
          </div>
        );
      }

      if (syncStatus.bidirectionalResult) {
        const { errors, localToDbSynced, dbToLocalSynced } =
          syncStatus.bidirectionalResult;

        if (errors.length > 0) {
          return (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <Badge variant="destructive" className="text-xs hidden sm:inline-flex">
                Sync Issues
              </Badge>
            </div>
          );
        }

        if (localToDbSynced > 0 || dbToLocalSynced > 0) {
          return (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <Badge
                variant="default"
                className="text-xs bg-green-100 text-green-700 hidden sm:inline-flex"
              >
                Synced
              </Badge>
            </div>
          );
        }
      }

      return (
        <div className="flex items-center gap-1">
          <Cloud className="h-4 w-4 text-green-500" />
          <Badge
            variant="default"
            className="text-xs bg-green-100 text-green-700 hidden sm:inline-flex"
          >
            Cloud
          </Badge>
        </div>
      );
    } else {
      if (hasLocalData) {
        return (
          <div className="flex items-center gap-1">
            <CloudOff className="h-4 w-4 text-blue-500" />
            <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
              {localDataCount} Local
            </Badge>
          </div>
        );
      }

      return (
        <div className="flex items-center gap-1">
          <CloudOff className="h-4 w-4 text-blue-500" />
          <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
            Local
          </Badge>
        </div>
      );
    }
  };

  return (
    <header className="border-b border-stone-200 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-rose-300 to-amber-300 rounded-full flex items-center justify-center">
                <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-serif text-stone-800">lunra</span>
            </Link>
          </div>

          {isLanding ? (
            // Landing page navigation
            <>
              <nav className="hidden md:flex items-center space-x-8 lg:space-x-10">
                <a
                  href="#features"
                  className="text-stone-600 hover:text-stone-800 transition-colors font-light text-sm lg:text-base"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="text-stone-600 hover:text-stone-800 transition-colors font-light text-sm lg:text-base"
                >
                  How it Works
                </a>
                <a
                  href="#testimonials"
                  className="text-stone-600 hover:text-stone-800 transition-colors font-light text-sm lg:text-base"
                >
                  Stories
                </a>
                <a
                  href="#pricing"
                  className="text-stone-600 hover:text-stone-800 transition-colors font-light text-sm lg:text-base"
                >
                  Pricing
                </a>
              </nav>
              <div className="hidden md:flex items-center space-x-3">
                <SyncStatusIndicator />
                {user ? (
                  <Link href="/dashboard">
                    <Button className="bg-rose-400 hover:bg-rose-500 text-white border-0 rounded-full px-6">
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    {isSupabaseAvailable && (
                      <Link href="/auth/signin">
                        <Button
                          variant="ghost"
                          className="text-stone-600 hover:text-stone-800"
                        >
                          Sign In
                        </Button>
                      </Link>
                    )}
                    {isSupabaseAvailable && (
                      <Link href="/auth/signup">
                        <Button className="bg-rose-400 hover:bg-rose-500 text-white border-0 rounded-full px-6">
                          Sign Up
                        </Button>
                      </Link>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            // App navigation
            <>
              <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
                <Link
                  href="/dashboard"
                  className="text-stone-600 hover:text-stone-800 transition-colors font-light text-sm lg:text-base"
                >
                  Dashboard
                </Link>
                <Link
                  href="/timeline"
                  className="text-stone-600 hover:text-stone-800 transition-colors font-light text-sm lg:text-base"
                >
                  Timeline
                </Link>
                <Link
                  href="/calendar"
                  className="text-stone-600 hover:text-stone-800 transition-colors font-light text-sm lg:text-base"
                >
                  Calendar
                </Link>
                <Link
                  href="/check-in"
                  className="text-stone-600 hover:text-stone-800 transition-colors font-light text-sm lg:text-base"
                >
                  Check-in
                </Link>
              </nav>

              <div className="hidden md:flex items-center space-x-3">
                <SyncStatusIndicator />
                {!user && isSupabaseAvailable && (
                  <>
                    <Link href="/auth/signin">
                      <Button
                        variant="ghost"
                        className="text-stone-600 hover:text-stone-800 text-sm"
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/signup">
                      <Button className="bg-rose-400 hover:bg-rose-500 text-white border-0 rounded-full px-4 text-sm">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
                {user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="text-stone-600 hover:text-stone-800 rounded-full"
                      >
                        <User className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>
                        <div className="flex flex-col">
                          <span>My Account</span>
                          <span className="text-xs text-stone-500 font-light">
                            {user.email}
                          </span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <Link href="/billing">
                        <DropdownMenuItem className="cursor-pointer">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Billing & Plans
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="text-rose-500 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Link href="/create-goal">
                  <Button className="bg-rose-400 hover:bg-rose-500 text-white border-0 rounded-full px-4 lg:px-6 text-sm">
                    New Goal
                  </Button>
                </Link>
              </div>
            </>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-stone-100 px-4 sm:px-6 py-4">
          <nav className="flex flex-col space-y-3">
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
                <div className="pt-2 border-t border-stone-100 space-y-2">
                  {user ? (
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-rose-400 hover:bg-rose-500 text-white rounded-full">
                        Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <>
                      {isSupabaseAvailable && (
                        <Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)}>
                          <Button className="w-full mb-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-full">
                            Sign In
                          </Button>
                        </Link>
                      )}
                      {isSupabaseAvailable && (
                        <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                          <Button className="w-full bg-rose-400 hover:bg-rose-500 text-white rounded-full">
                            Sign Up
                          </Button>
                        </Link>
                      )}
                    </>
                  )}
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
                <div className="pt-2 border-t border-stone-100">
                  <Link href="/create-goal" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-rose-400 hover:bg-rose-500 text-white rounded-full">
                      New Goal
                    </Button>
                  </Link>
                </div>
                {!user && isSupabaseAvailable && (
                  <div className="pt-2 border-t border-stone-100 space-y-2">
                    <Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-full">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-rose-400 hover:bg-rose-500 text-white rounded-full">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
                {user && (
                  <div className="pt-2 border-t border-stone-100">
                    <Button
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-white hover:bg-stone-50 text-rose-500 border border-stone-200 rounded-full"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                )}
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
