"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { type GoalDataManager, getDataManager } from "@/lib/data-manager"
import { useAuth } from "@/contexts/auth-context"
import type { SavedGoal } from "@/types"

interface GoalDataContextType {
  dataManager: GoalDataManager
  goals: SavedGoal[]
  loading: boolean
  error: Error | null
  refreshGoals: () => Promise<void>
}

const GoalDataContext = createContext<GoalDataContextType | undefined>(undefined)

export function GoalDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [dataManager, setDataManager] = useState<GoalDataManager>(() => getDataManager())
  const [goals, setGoals] = useState<SavedGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Update data manager when user changes
  useEffect(() => {
    const manager = getDataManager(user?.id || undefined)
    setDataManager(manager)

    // If user just logged in, sync local goals to database
    if (user?.id) {
      manager
        .syncLocalGoalsToDatabase()
        .then(() => refreshGoals())
        .catch((err) => console.error("Error syncing goals:", err))
    } else {
      refreshGoals()
    }
  }, [user?.id])

  // Function to refresh goals
  const refreshGoals = async () => {
    setLoading(true)
    setError(null)

    try {
      const fetchedGoals = await dataManager.getGoals()
      setGoals(fetchedGoals)
    } catch (err) {
      console.error("Error fetching goals:", err)
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <GoalDataContext.Provider value={{ dataManager, goals, loading, error, refreshGoals }}>
      {children}
    </GoalDataContext.Provider>
  )
}

export function useGoalData() {
  const context = useContext(GoalDataContext)
  if (context === undefined) {
    throw new Error("useGoalData must be used within a GoalDataProvider")
  }
  return context
}
