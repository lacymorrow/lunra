"use client";

import { useAuth } from "@/contexts/auth-context";
import { type GoalDataManager, cleanupDataManager, getDataManager } from "@/lib/data-manager";
import type { SavedGoal } from "@/types";
import type React from "react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

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

  // Keep a ref to the data manager so refreshGoals always reads the latest
  const managerRef = useRef<GoalDataManager>(dataManager);

  // Stable refreshGoals that reads from the ref
  const refreshGoals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedGoals = await managerRef.current.getGoals();
      setGoals(fetchedGoals);
    } catch (err) {
      console.error("Error fetching goals:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  // Update data manager when user or profile changes
  useEffect(() => {
    const manager = getDataManager(user?.id || undefined, userProfile);
    setDataManager(manager);
    managerRef.current = manager;

    // If user just logged in, do initial sync (only for authenticated users)
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
          // Still load local goals even if sync fails
          refreshGoals();
        });
    } else {
      refreshGoals();
    }

    // Cleanup on unmount: destroy the data manager (stops auto-sync interval)
    return () => {
      cleanupDataManager();
    };
  }, [user?.id, userProfile?.plan_id, refreshGoals]);

  // Manual sync for paid users
  const triggerManualSync = useCallback(async () => {
    if (!user?.id || userProfile?.plan_id !== "bloom") {
      return;
    }

    setSyncStatus((prev) => ({ ...prev, isLoading: true }));

    try {
      const result = await managerRef.current.bidirectionalSync();
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
  }, [user?.id, userProfile?.plan_id, refreshGoals]);

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
