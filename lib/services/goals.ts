import { supabase } from "@/lib/supabase"
import type { DatabaseGoal, DatabaseGoalWithMilestones } from "@/types/database"
import type { SavedGoal } from "@/types"
import { convertLocalStorageToDatabase } from "@/types/database"

export async function getGoals(userId: string): Promise<DatabaseGoalWithMilestones[]> {
  // Use the custom function we created in our migration to get goals with stats
  const { data, error } = await supabase().rpc("get_user_goals_with_stats", { user_uuid: userId })

  if (error) {
    console.error("Error fetching goals:", error)
    throw error
  }

  return data || []
}

export async function getGoalById(goalId: string, userId: string): Promise<DatabaseGoalWithMilestones | null> {
  // First get the goal
  const { data: goal, error: goalError } = await supabase()
    .from("goals")
    .select("*")
    .eq("id", goalId)
    .eq("user_id", userId)
    .single()

  if (goalError) {
    console.error("Error fetching goal:", goalError)
    return null
  }

  if (!goal) return null

  // Then get the milestones
  const { data: milestones, error: milestonesError } = await supabase()
    .from("milestones")
    .select("*")
    .eq("goal_id", goalId)
    .order("week", { ascending: true })

  if (milestonesError) {
    console.error("Error fetching milestones:", milestonesError)
  }

  return {
    ...goal,
    milestones: milestones || [],
  }
}

export async function createGoal(
  goalData: Omit<SavedGoal, "id" | "createdAt">,
  userId: string,
): Promise<DatabaseGoalWithMilestones | null> {
  // Convert from localStorage format to database format
  const dbGoalData = convertLocalStorageToDatabase(goalData)

  // Start a transaction
  const { data: goal, error: goalError } = await supabase()
    .from("goals")
    .insert({
      ...dbGoalData,
      user_id: userId,
    })
    .select()
    .single()

  if (goalError) {
    console.error("Error creating goal:", goalError)
    throw goalError
  }

  // Insert milestones if they exist
  if (goalData.milestones && goalData.milestones.length > 0) {
    const milestonesToInsert = goalData.milestones.map((m) => ({
      goal_id: goal.id,
      week: m.week,
      task: m.task,
      status: m.status as "pending" | "in-progress" | "completed",
      progress: m.progress,
    }))

    const { data: milestones, error: milestonesError } = await supabase()
      .from("milestones")
      .insert(milestonesToInsert)
      .select()

    if (milestonesError) {
      console.error("Error creating milestones:", milestonesError)
    }

    return {
      ...goal,
      milestones: milestones || [],
    }
  }

  return {
    ...goal,
    milestones: [],
  }
}

export async function updateGoal(
  goalId: string,
  goalData: Partial<SavedGoal>,
  userId: string,
): Promise<DatabaseGoal | null> {
  // Convert from localStorage format to database format
  const dbGoalData = convertLocalStorageToDatabase(goalData)

  // Update the goal
  const { data, error } = await supabase()
    .from("goals")
    .update(dbGoalData)
    .eq("id", goalId)
    .eq("user_id", userId) // Security check
    .select()
    .single()

  if (error) {
    console.error("Error updating goal:", error)
    throw error
  }

  return data
}

export async function deleteGoal(goalId: string, userId: string): Promise<void> {
  // Delete the goal (milestones will be cascade deleted due to our schema)
  const { error } = await supabase().from("goals").delete().eq("id", goalId).eq("user_id", userId) // Security check

  if (error) {
    console.error("Error deleting goal:", error)
    throw error
  }
}
