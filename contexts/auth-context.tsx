"use client";

import {
  getUserProfileClient,
  getUserSubscriptionClient,
} from "@/lib/services/subscriptions-client";
import { supabase } from "@/lib/supabase";
import type {
  DatabaseSubscription,
  DatabaseUserProfile,
} from "@/types/database";
import type { Session, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

  const refreshProfile = useCallback(async () => {
    if (!user?.id) {
      setUserProfile(null);
      setUserSubscription(null);
      return;
    }

    setIsDataLoading(true);
    try {
      const [profile, subscription] = await Promise.all([
        getUserProfileClient(user.id),
        getUserSubscriptionClient(user.id),
      ]);

      setUserProfile(profile);
      setUserSubscription(subscription);
    } catch (error) {
      console.error("Error refreshing profile data:", error);
    } finally {
      setIsDataLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const { data: authListener } = supabase().auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);

        // Load profile and subscription data when user signs in
        if (currentSession?.user) {
          await refreshProfile();
        } else {
          setUserProfile(null);
          setUserSubscription(null);
        }

        if (event === "SIGNED_OUT") {
          // Handle sign out (e.g., redirect to login)
          setUserProfile(null);
          setUserSubscription(null);
          router.push("/auth/signin");
        } else if (event === "SIGNED_IN") {
          // Handle sign in (e.g., redirect to dashboard)
          router.push("/dashboard");
        }
      }
    );

    // Initial session check
    const initializeAuth = async () => {
      const { data } = await supabase().auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoading(false);

      // Load profile data if we have a user
      if (data.session?.user) {
        await refreshProfile();
      }
    };

    initializeAuth();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, refreshProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase().auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase().auth.signUp({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase().auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    return { error };
  };

  const value = {
    user,
    session,
    userProfile,
    userSubscription,
    isLoading,
    isDataLoading,
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
