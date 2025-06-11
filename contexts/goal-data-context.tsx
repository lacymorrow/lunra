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
}

interface GoalDataContextType {
  dataManager: GoalDataManager;
  goals: SavedGoal[];
  loading: boolean;
  error: Error | null;
  refreshGoals: () => Promise<void>;
  syncStatus: SyncStatus;
}

const GoalDataContext = createContext<GoalDataContextType | undefined>(
  undefined
);

export function GoalDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [dataManager, setDataManager] = useState<GoalDataManager>(() =>
    getDataManager()
  );
  const [goals, setGoals] = useState<SavedGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isLoading: false,
    result: null,
  });

  // Update data manager when user changes
  useEffect(() => {
    const manager = getDataManager(user?.id || undefined);
    setDataManager(manager);

    // If user just logged in, sync local goals to database
    if (user?.id) {
      setSyncStatus({ isLoading: true, result: null });
      manager
        .syncLocalGoalsToDatabase()
        .then((result) => {
          setSyncStatus({ isLoading: false, result });
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
          });
        });
    } else {
      refreshGoals();
    }
  }, [user?.id]);

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

  return (
    <GoalDataContext.Provider
      value={{ dataManager, goals, loading, error, refreshGoals, syncStatus }}
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
