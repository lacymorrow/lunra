"use client";

import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { type GoalDataManager, getDataManager } from "@/lib/data-manager";
import type { SavedGoal } from "@/types";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface GoalDataContextType {
  dataManager: GoalDataManager;
  goals: SavedGoal[];
  loading: boolean;
  error: Error | null;
  refreshGoals: () => Promise<void>;
  performSync: (manager: GoalDataManager) => Promise<void>;
  syncStatus: {
    isLoading: boolean;
    lastSync: Date | null;
    result: {
      synced: number;
      skipped: number;
      errors: string[];
      clearedLocal: boolean;
    } | null;
  };
}

const GoalDataContext = createContext<GoalDataContextType | undefined>(
  undefined
);

export function GoalDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dataManager, setDataManager] = useState<GoalDataManager>(() =>
    getDataManager()
  );
  const [goals, setGoals] = useState<SavedGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [syncStatus, setSyncStatus] = useState({
    isLoading: false,
    lastSync: null as Date | null,
    result: null as {
      synced: number;
      skipped: number;
      errors: string[];
      clearedLocal: boolean;
    } | null,
  });

  // Function to refresh goals
  const refreshGoals = useCallback(async () => {
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
  }, [dataManager]);

  const performSync = useCallback(
    async (manager: GoalDataManager) => {
      setSyncStatus((prev) => ({ ...prev, isLoading: true }));

      try {
        const result = await manager.syncLocalGoalsToDatabase();

        setSyncStatus({
          isLoading: false,
          lastSync: new Date(),
          result,
        });

        // Provide user feedback based on sync results
        if (result.synced > 0) {
          toast({
            title: "🎉 Goals Synced Successfully!",
            description: `${result.synced} goal${
              result.synced > 1 ? "s" : ""
            } transferred to your account.${
              result.skipped > 0
                ? ` ${result.skipped} duplicate${
                    result.skipped > 1 ? "s" : ""
                  } skipped.`
                : ""
            }`,
          });
        } else if (result.skipped > 0) {
          toast({
            title: "Goals Already Synced",
            description: `All ${result.skipped} goal${
              result.skipped > 1 ? "s were" : " was"
            } already in your account.`,
          });
        }

        if (result.errors.length > 0) {
          toast({
            title: "Sync Completed with Issues",
            description: `${result.errors.length} goal${
              result.errors.length > 1 ? "s" : ""
            } failed to sync. Check console for details.`,
            variant: "destructive",
          });
        }

        // Manually refresh goals after sync
        await refreshGoals();
      } catch (err) {
        console.error("Error syncing goals:", err);
        setSyncStatus((prev) => ({
          ...prev,
          isLoading: false,
          result: {
            synced: 0,
            skipped: 0,
            errors: [err instanceof Error ? err.message : String(err)],
            clearedLocal: false,
          },
        }));

        toast({
          title: "Sync Failed",
          description: "Unable to sync your goals. Please try again later.",
          variant: "destructive",
        });
      }
    },
    [toast, refreshGoals]
  );

  // Update data manager when user changes
  useEffect(() => {
    const manager = getDataManager(user?.id || undefined);
    setDataManager(manager);

    // If user just logged in, sync local goals to database
    if (user?.id) {
      // Call performSync directly instead of through dependency
      setSyncStatus((prev) => ({ ...prev, isLoading: true }));

      const syncGoals = async () => {
        try {
          const result = await manager.syncLocalGoalsToDatabase();

          setSyncStatus({
            isLoading: false,
            lastSync: new Date(),
            result,
          });

          // Provide user feedback based on sync results
          if (result.synced > 0) {
            toast({
              title: "🎉 Goals Synced Successfully!",
              description: `${result.synced} goal${
                result.synced > 1 ? "s" : ""
              } transferred to your account.${
                result.skipped > 0
                  ? ` ${result.skipped} duplicate${
                      result.skipped > 1 ? "s" : ""
                    } skipped.`
                  : ""
              }`,
            });
          } else if (result.skipped > 0) {
            toast({
              title: "Goals Already Synced",
              description: `All ${result.skipped} goal${
                result.skipped > 1 ? "s were" : " was"
              } already in your account.`,
            });
          }

          if (result.errors.length > 0) {
            toast({
              title: "Sync Completed with Issues",
              description: `${result.errors.length} goal${
                result.errors.length > 1 ? "s" : ""
              } failed to sync. Check console for details.`,
              variant: "destructive",
            });
          }

          // Manually refresh goals after sync
          setLoading(true);
          setError(null);
          try {
            const fetchedGoals = await manager.getGoals();
            setGoals(fetchedGoals);
          } catch (err) {
            console.error("Error fetching goals after sync:", err);
            setError(err instanceof Error ? err : new Error(String(err)));
          } finally {
            setLoading(false);
          }
        } catch (err) {
          console.error("Error syncing goals:", err);
          setSyncStatus((prev) => ({
            ...prev,
            isLoading: false,
            result: {
              synced: 0,
              skipped: 0,
              errors: [err instanceof Error ? err.message : String(err)],
              clearedLocal: false,
            },
          }));

          toast({
            title: "Sync Failed",
            description: "Unable to sync your goals. Please try again later.",
            variant: "destructive",
          });
        }
      };

      syncGoals();
    } else {
      // Refresh goals for non-authenticated users
      const loadGoals = async () => {
        setLoading(true);
        setError(null);

        try {
          const fetchedGoals = await manager.getGoals();
          setGoals(fetchedGoals);
        } catch (err) {
          console.error("Error fetching goals:", err);
          setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
          setLoading(false);
        }
      };

      loadGoals();
    }
  }, [user?.id, toast]); // Only depend on user?.id and toast

  return (
    <GoalDataContext.Provider
      value={{
        dataManager,
        goals,
        loading,
        error,
        refreshGoals,
        performSync,
        syncStatus,
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
