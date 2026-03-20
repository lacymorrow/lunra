"use client";

import {
  getUserProfileClient,
  getUserSubscriptionClient,
} from "@/lib/services/subscriptions-client";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type {
  DatabaseSubscription,
  DatabaseUserProfile,
} from "@/types/database";
import type { Session, User } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  userProfile: DatabaseUserProfile | null;
  userSubscription: DatabaseSubscription | null;
  isLoading: boolean;
  isDataLoading: boolean;
  isSupabaseAvailable: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: any; data: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<DatabaseUserProfile | null>(
    null
  );
  const [userSubscription, setUserSubscription] =
    useState<DatabaseSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const router = useRouter();
  const pathnameRef = useRef<string | null>(null);
  const pathname = usePathname();

  // Keep pathname in a ref so auth listener always has the latest value
  pathnameRef.current = pathname;

  const isSupabaseAvailable = isSupabaseConfigured;

  // Use a ref-based refreshProfile to avoid stale closure issues
  const userIdRef = useRef<string | null>(null);
  userIdRef.current = user?.id ?? null;

  const refreshProfile = useCallback(async () => {
    const currentUserId = userIdRef.current;
    if (!currentUserId) {
      setUserProfile(null);
      setUserSubscription(null);
      return;
    }

    setIsDataLoading(true);
    try {
      const [profile, subscription] = await Promise.all([
        getUserProfileClient(currentUserId),
        getUserSubscriptionClient(currentUserId),
      ]);

      setUserProfile(profile);
      setUserSubscription(subscription);
    } catch (error) {
      console.error("Error refreshing profile data:", error);
    } finally {
      setIsDataLoading(false);
    }
  }, []); // Stable reference — reads from userIdRef

  useEffect(() => {
    if (!isSupabaseAvailable) {
      setIsLoading(false);
      return;
    }

    const client = supabase();
    if (!client) {
      setIsLoading(false);
      return;
    }

    let initialized = false;

    const { data: authListener } = client.auth.onAuthStateChange(
      async (event: string, currentSession: typeof session) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        // Update the ref immediately so refreshProfile reads the latest user
        userIdRef.current = currentSession?.user?.id ?? null;
        setIsLoading(false);

        // Skip the initial event if initializeAuth already handled it
        if (!initialized) return;

        // Load profile and subscription data when user signs in
        if (currentSession?.user) {
          await refreshProfile();
        } else {
          setUserProfile(null);
          setUserSubscription(null);
        }

        if (event === "SIGNED_OUT") {
          setUserProfile(null);
          setUserSubscription(null);
          router.push("/auth/signin");
        } else if (event === "SIGNED_IN") {
          // Use ref for latest pathname value
          const currentPathname = pathnameRef.current;
          const shouldRedirectToDashboard =
            currentPathname === "/" || (currentPathname && currentPathname.startsWith("/auth"));

          if (shouldRedirectToDashboard) {
            router.push("/dashboard");
          }
        }
      }
    );

    // Initial session check
    const initializeAuth = async () => {
      try {
        const { data } = await client.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);
        userIdRef.current = data.session?.user?.id ?? null;
        setIsLoading(false);

        // Load profile data if we have a user
        if (data.session?.user) {
          await refreshProfile();
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        setIsLoading(false);
      }
      initialized = true;
    };

    initializeAuth();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, refreshProfile, isSupabaseAvailable]);

  const signIn = useCallback(async (email: string, password: string) => {
    const client = supabase();
    if (!client) return { error: new Error("Supabase not configured") };
    const { error } = await client.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const client = supabase();
    if (!client) return { data: null, error: new Error("Supabase not configured") };
    const { data, error } = await client.auth.signUp({
      email,
      password,
    });
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    const client = supabase();
    if (!client) return;
    await client.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const client = supabase();
    if (!client) return { error: new Error("Supabase not configured") };
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    return { error };
  }, []);

  const value = {
    user,
    session,
    userProfile,
    userSubscription,
    isLoading,
    isDataLoading,
    isSupabaseAvailable,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
