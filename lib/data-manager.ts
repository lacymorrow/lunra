import type { SavedGoal } from "@/types"
import { createGoal, getGoalById, getGoals, updateGoal, deleteGoal } from "@/lib/services/goals"
import { convertDatabaseToLocalStorage } from "@/types/database"

// Local storage keys
const GOALS_KEY = "savedGoals"

// Helper functions for localStorage
function getLocalGoals(): SavedGoal[] {
  if (typeof window === "undefined") return []

  const savedGoals = localStorage.getItem(GOALS_KEY)
  return savedGoals ? JSON.parse(savedGoals) : []
}

function setLocalGoals(goals: SavedGoal[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals))
}

function getLocalGoalById(id: number): SavedGoal | null {
  const goals = getLocalGoals()
  return goals.find((goal) => goal.id === id) || null
}

function createLocalGoal(goal: Omit<SavedGoal, "id" | "createdAt">): SavedGoal {
  const goals = getLocalGoals()

  // Generate a new ID (simple implementation)
  const newId = goals.length > 0 ? Math.max(...goals.map((g) => g.id)) + 1 : 1

  const newGoal: SavedGoal = {
    ...goal,
    id: newId,
    createdAt: new Date().toISOString(),
  }

  goals.push(newGoal)
  setLocalGoals(goals)
  return newGoal
}

function updateLocalGoal(id: number, goalData: Partial<SavedGoal>): SavedGoal | null {
  const goals = getLocalGoals()
  const index = goals.findIndex((goal) => goal.id === id)

  if (index === -1) return null

  goals[index] = { ...goals[index], ...goalData }
  setLocalGoals(goals)
  return goals[index]
}

function deleteLocalGoal(id: number): void {
  const goals = getLocalGoals()
  const filteredGoals = goals.filter((goal) => goal.id !== id)
  setLocalGoals(filteredGoals)
}

// The main data manager class
export class GoalDataManager {
  private userId: string | null = null

  constructor(userId?: string) {
    this.userId = userId || null
  }

  setUserId(userId: string | null) {
    this.userId = userId
  }

  get isAuthenticated(): boolean {
    return !!this.userId
  }

  // Sync local goals to database when user logs in
  async syncLocalGoalsToDatabase(): Promise<void> {
    if (!this.isAuthenticated) return

    const localGoals = getLocalGoals()
    if (localGoals.length === 0) return

    // Get existing database goals to avoid duplicates
    const dbGoals = await getGoals(this.userId!)

    // Create a map of titles to detect potential duplicates
    const dbGoalTitles = new Set(dbGoals.map((g) => g.title))

    // Upload each local goal that doesn't exist in the database
    for (const localGoal of localGoals) {
      // Simple duplicate detection by title
      if (!dbGoalTitles.has(localGoal.title)) {
        try {
          await createGoal(localGoal, this.userId!)
        } catch (error) {
          console.error(`Failed to sync goal "${localGoal.title}":`, error)
        }
      }
    }

    // Optionally clear local storage after sync
    // localStorage.removeItem(GOALS_KEY)
  }

  // Core CRUD operations that work with both localStorage and database
  async getGoals(): Promise<SavedGoal[]> {
    if (this.isAuthenticated) {
      try {
        const dbGoals = await getGoals(this.userId!)
        return dbGoals.map(convertDatabaseToLocalStorage)
      } catch (error) {
        console.error("Error fetching goals from database:", error)
        return getLocalGoals() // Fallback to localStorage
      }
    } else {
      return getLocalGoals()
    }
  }

  async getGoalById(id: number | string): Promise<SavedGoal | null> {
    if (this.isAuthenticated) {
      try {
        // If it's a number, it's a localStorage ID
        if (typeof id === "number") {
          // Try to find a matching goal in the database by title
          const localGoal = getLocalGoalById(id)
          if (!localGoal) return null

          const dbGoals = await getGoals(this.userId!)
          const matchingGoal = dbGoals.find((g) => g.title === localGoal.title)

          if (matchingGoal) {
            return convertDatabaseToLocalStorage(matchingGoal)
          }

          // If no match in database, return the local goal
          return localGoal
        }

        // If it's a string, it's a database UUID
        const dbGoal = await getGoalById(id as string, this.userId!)
        return dbGoal ? convertDatabaseToLocalStorage(dbGoal) : null
      } catch (error) {
        console.error("Error fetching goal from database:", error)

        // If it's a number ID, try localStorage
        if (typeof id === "number") {
          return getLocalGoalById(id)
        }
        return null
      }
    } else {
      // For unauthenticated users, only number IDs are valid
      if (typeof id === "number") {
        return getLocalGoalById(id)
      }
      return null
    }
  }

  async createGoal(goalData: Omit<SavedGoal, "id" | "createdAt">): Promise<SavedGoal> {
    if (this.isAuthenticated) {
      try {
        const dbGoal = await createGoal(goalData, this.userId!)
        return convertDatabaseToLocalStorage(dbGoal!)
      } catch (error) {
        console.error("Error creating goal in database:", error)
        // Fallback to localStorage
        return createLocalGoal(goalData)
      }
    } else {
      return createLocalGoal(goalData)
    }
  }

  async updateGoal(id: number | string, goalData: Partial<SavedGoal>): Promise<SavedGoal | null> {
    if (this.isAuthenticated) {
      try {
        // If it's a number, it's a localStorage ID
        if (typeof id === "number") {
          // Try to find a matching goal in the database by title
          const localGoal = getLocalGoalById(id)
          if (!localGoal) return null

          const dbGoals = await getGoals(this.userId!)
          const matchingGoal = dbGoals.find((g) => g.title === localGoal.title)

          if (matchingGoal) {
            // Update the database goal
            const updatedDbGoal = await updateGoal(matchingGoal.id, goalData, this.userId!)
            return updatedDbGoal
              ? convertDatabaseToLocalStorage({
                  ...updatedDbGoal,
                  milestones: matchingGoal.milestones,
                })
              : null
          }

          // If no match in database, update the local goal
          return updateLocalGoal(id, goalData)
        }

        // If it's a string, it's a database UUID
        const updatedDbGoal = await updateGoal(id as string, goalData, this.userId!)
        if (!updatedDbGoal) return null

        // Get the full goal with milestones
        const fullGoal = await getGoalById(id as string, this.userId!)
        return fullGoal ? convertDatabaseToLocalStorage(fullGoal) : null
      } catch (error) {
        console.error("Error updating goal in database:", error)

        // If it's a number ID, try localStorage
        if (typeof id === "number") {
          return updateLocalGoal(id, goalData)
        }
        return null
      }
    } else {
      // For unauthenticated users, only number IDs are valid
      if (typeof id === "number") {
        return updateLocalGoal(id, goalData)
      }
      return null
    }
  }

  async deleteGoal(id: number | string): Promise<boolean> {
    if (this.isAuthenticated) {
      try {
        // If it's a number, it's a localStorage ID
        if (typeof id === "number") {
          // Try to find a matching goal in the database by title
          const localGoal = getLocalGoalById(id)
          if (!localGoal) return false

          const dbGoals = await getGoals(this.userId!)
          const matchingGoal = dbGoals.find((g) => g.title === localGoal.title)

          if (matchingGoal) {
            // Delete the database goal
            await deleteGoal(matchingGoal.id, this.userId!)
          }

          // Also delete the local goal
          deleteLocalGoal(id)
          return true
        }

        // If it's a string, it's a database UUID
        await deleteGoal(id as string, this.userId!)
        return true
      } catch (error) {
        console.error("Error deleting goal from database:", error)

        // If it's a number ID, try localStorage
        if (typeof id === "number") {
          deleteLocalGoal(id)
          return true
        }
        return false
      }
    } else {
      // For unauthenticated users, only number IDs are valid
      if (typeof id === "number") {
        deleteLocalGoal(id)
        return true
      }
      return false
    }
  }
}

// Create a singleton instance
let dataManagerInstance: GoalDataManager | null = null

export function getDataManager(userId?: string): GoalDataManager {
  if (!dataManagerInstance) {
    dataManagerInstance = new GoalDataManager(userId)
  } else if (userId) {
    dataManagerInstance.setUserId(userId)
  }

  return dataManagerInstance
}
