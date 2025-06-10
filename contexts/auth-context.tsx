"use client";

import {
  createUserProfileClient,
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
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  userProfile: DatabaseUserProfile | null;
  subscription: DatabaseSubscription | null;
  isLoading: boolean;
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
  const [subscription, setSubscription] = useState<DatabaseSubscription | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Function to refresh user profile and subscription
  const refreshProfile = async () => {
    if (!user) {
      console.log("🔍 [AuthContext] refreshProfile: no user, skipping");
      return;
    }

    console.log("🔄 [AuthContext] refreshProfile: starting for user", user.id);

    try {
      let profile = await getUserProfileClient(user.id);
      console.log("👤 [AuthContext] refreshProfile: profile result", {
        hasProfile: !!profile,
        profileId: profile?.id,
        planId: profile?.plan_id,
      });

      if (!profile) {
        console.log("👤 [AuthContext] refreshProfile: creating new profile");
        profile = await createUserProfileClient(user.id, {
          full_name:
            user.user_metadata?.full_name || user.email?.split("@")[0] || null,
        });
        console.log(
          "👤 [AuthContext] refreshProfile: created profile",
          !!profile
        );
      }
      setUserProfile(profile);

      const sub = await getUserSubscriptionClient(user.id);
      console.log("📋 [AuthContext] refreshProfile: subscription result", {
        hasSubscription: !!sub,
        subscriptionId: sub?.id,
        status: sub?.status,
        planId: sub?.plan_id,
      });
      setSubscription(sub);
    } catch (error) {
      console.error(
        "💥 [AuthContext] Error fetching user profile/subscription:",
        error
      );
    }
  };

  useEffect(() => {
    const { data: authListener } = supabase().auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await refreshProfile();
        } else {
          setUserProfile(null);
          setSubscription(null);
        }

        setIsLoading(false);

        if (event === "SIGNED_OUT") {
          // Handle sign out (e.g., redirect to login)
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

      if (data.session?.user) {
        await refreshProfile();
      }

      setIsLoading(false);
    };

    initializeAuth();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

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
    subscription,
    isLoading,
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
