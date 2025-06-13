"use client";

import { useAuth } from "@/contexts/auth-context";
import { type GoalDataManager, getDataManager } from "@/lib/data-manager";
import type { SavedGoal } from "@/types";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

interface SyncStatus {
  isLoading: boolean;
  result?: {
    synced: number;
    skipped: number;
    errors: string[];
    clearedLocal: boolean;
  } | null;
  bidirectionalResult?: {
    localToDbSynced: number;
    dbToLocalSynced: number;
    conflicts: number;
    errors: string[];
  } | null;
}

interface GoalDataContextType {
  dataManager: GoalDataManager;
  goals: SavedGoal[];
  loading: boolean;
  error: Error | null;
  refreshGoals: () => Promise<void>;
  syncStatus: SyncStatus;
  triggerManualSync: () => Promise<void>;
}

const GoalDataContext = createContext<GoalDataContextType | undefined>(
  undefined
);

export function GoalDataProvider({ children }: { children: React.ReactNode }) {
  const { user, userProfile } = useAuth();
  const [dataManager, setDataManager] = useState<GoalDataManager>(() =>
    getDataManager()
  );
  const [goals, setGoals] = useState<SavedGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isLoading: false,
    result: null,
    bidirectionalResult: null,
  });

  // Update data manager when user or profile changes
  useEffect(() => {
    const manager = getDataManager(user?.id || undefined, userProfile);
    setDataManager(manager);

    // If user just logged in, do initial sync
    if (user?.id) {
      setSyncStatus({
        isLoading: true,
        result: null,
        bidirectionalResult: null,
      });
      manager
        .syncLocalGoalsToDatabase()
        .then((result) => {
          setSyncStatus({
            isLoading: false,
            result,
            bidirectionalResult: null,
          });
          refreshGoals();
        })
        .catch((err) => {
          console.error("Error syncing goals:", err);
          setSyncStatus({
            isLoading: false,
            result: {
              synced: 0,
              skipped: 0,
              errors: [err?.message || String(err)],
              clearedLocal: false,
            },
            bidirectionalResult: null,
          });
        });
    } else {
      refreshGoals();
    }
  }, [user?.id, userProfile?.plan_id]);

  // Function to refresh goals
  const refreshGoals = async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedGoals = await dataManager.getGoals();
      setGoals(fetchedGoals);
    } catch (err) {
      console.error("Error fetching goals:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Manual sync for paid users
  const triggerManualSync = async () => {
    if (!user?.id || userProfile?.plan_id !== "bloom") {
      console.log("Manual sync not available for non-paid users");
      return;
    }

    setSyncStatus((prev) => ({ ...prev, isLoading: true }));

    try {
      const result = await dataManager.bidirectionalSync();
      setSyncStatus((prev) => ({
        ...prev,
        isLoading: false,
        bidirectionalResult: result,
      }));
      await refreshGoals();
    } catch (error) {
      console.error("Manual sync failed:", error);
      setSyncStatus((prev) => ({
        ...prev,
        isLoading: false,
        bidirectionalResult: {
          localToDbSynced: 0,
          dbToLocalSynced: 0,
          conflicts: 0,
          errors: [error instanceof Error ? error.message : String(error)],
        },
      }));
    }
  };

  return (
    <GoalDataContext.Provider
      value={{
        dataManager,
        goals,
        loading,
        error,
        refreshGoals,
        syncStatus,
        triggerManualSync,
      }}
    >
      {children}
    </GoalDataContext.Provider>
  );
}

export function useGoalData() {
  const context = useContext(GoalDataContext);
  if (context === undefined) {
    throw new Error("useGoalData must be used within a GoalDataProvider");
  }
  return context;
}
