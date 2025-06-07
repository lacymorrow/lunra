"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any; data: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const { data: authListener } = supabase().auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      setIsLoading(false)

      if (event === "SIGNED_OUT") {
        // Handle sign out (e.g., redirect to login)
        router.push("/auth/signin")
      } else if (event === "SIGNED_IN") {
        // Handle sign in (e.g., redirect to dashboard)
        router.push("/dashboard")
      }
    })

    // Initial session check
    const initializeAuth = async () => {
      const { data } = await supabase().auth.getSession()
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setIsLoading(false)
    }

    initializeAuth()

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase().auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase().auth.signUp({
      email,
      password,
    })

    if (error) {
      return { data, error }
    }

    // If Supabase user created successfully, create Stripe customer
    if (data.user) {
      try {
        // Assuming user's full name might not be available at signup directly from email/password
        // You might want to collect it in your form and pass it here if needed by Stripe
        const response = await fetch("/api/create-stripe-customer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: data.user.id,
            email: data.user.email,
            // name: data.user.user_metadata?.full_name || '', // Example if you store name in metadata
          }),
        })

        if (!response.ok) {
          const stripeError = await response.json()
          console.error("Failed to create Stripe customer:", stripeError.error)
          // Decide on error handling:
          // - Log and continue (user exists in Supabase, Stripe customer can be created later/manually)
          // - Inform user (though signup itself was successful for your app)
          // - Potentially, if critical, you could try to delete the Supabase user, but this adds complexity.
          // For now, we'll log the error. The user is signed up in Supabase.
        } else {
          const stripeResult = await response.json()
          console.log("Stripe customer created:", stripeResult.stripeCustomerId)
        }
      } catch (fetchError) {
        console.error("Error calling /api/create-stripe-customer:", fetchError)
      }
    }

    return { data, error }
  }

  const signOut = async () => {
    await supabase().auth.signOut()
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })
    return { error }
  }

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
