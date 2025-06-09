import type { SupabaseClient } from "@supabase/supabase-js"
import type { DatabaseMilestone, Database } from "@/types/database"

export async function getMilestonesByGoalId(
  supabase: SupabaseClient<Database>,
  goalId: string, 
  userId: string
): Promise<DatabaseMilestone[]> {
  // First verify the user owns this goal
  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .select("id")
    .eq("id", goalId)
    .eq("user_id", userId)
    .single()

  if (goalError || !goal) {
    console.error("Error verifying goal ownership:", goalError)
    return []
  }

  // Then get the milestones
  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("goal_id", goalId)
    .order("week", { ascending: true })

  if (error) {
    console.error("Error fetching milestones:", error)
    return []
  }

  return data || []
}

export async function createMilestone(
  supabase: SupabaseClient<Database>,
  milestone: Omit<DatabaseMilestone, "id" | "created_at" | "updated_at">,
  userId: string,
): Promise<DatabaseMilestone | null> {
  // First verify the user owns this goal
  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .select("id")
    .eq("id", milestone.goal_id)
    .eq("user_id", userId)
    .single()

  if (goalError || !goal) {
    console.error("Error verifying goal ownership:", goalError)
    throw new Error("Unauthorized: You don't own this goal")
  }

  // Then create the milestone
  const { data, error } = await supabase.from("milestones").insert(milestone).select().single()

  if (error) {
    console.error("Error creating milestone:", error)
    throw error
  }

  return data
}

export async function updateMilestone(
  supabase: SupabaseClient<Database>,
  milestoneId: string,
  milestoneData: Partial<Omit<DatabaseMilestone, "id" | "goal_id" | "created_at" | "updated_at">>,
  userId: string,
): Promise<DatabaseMilestone | null> {
  // First get the milestone to verify ownership
  const { data: milestone, error: milestoneError } = await supabase
    .from("milestones")
    .select("goal_id")
    .eq("id", milestoneId)
    .single()

  if (milestoneError || !milestone) {
    console.error("Error fetching milestone:", milestoneError)
    return null
  }

  // Verify the user owns the goal this milestone belongs to
  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .select("id")
    .eq("id", milestone.goal_id)
    .eq("user_id", userId)
    .single()

  if (goalError || !goal) {
    console.error("Error verifying goal ownership:", goalError)
    throw new Error("Unauthorized: You don't own this goal")
  }

  // Update the milestone
  const { data, error } = await supabase
    .from("milestones")
    .update(milestoneData)
    .eq("id", milestoneId)
    .select()
    .single()

  if (error) {
    console.error("Error updating milestone:", error)
    throw error
  }

  return data
}

export async function deleteMilestone(
  supabase: SupabaseClient<Database>,
  milestoneId: string, 
  userId: string
): Promise<void> {
  // First get the milestone to verify ownership
  const { data: milestone, error: milestoneError } = await supabase
    .from("milestones")
    .select("goal_id")
    .eq("id", milestoneId)
    .single()

  if (milestoneError || !milestone) {
    console.error("Error fetching milestone:", milestoneError)
    return
  }

  // Verify the user owns the goal this milestone belongs to
  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .select("id")
    .eq("id", milestone.goal_id)
    .eq("user_id", userId)
    .single()

  if (goalError || !goal) {
    console.error("Error verifying goal ownership:", goalError)
    throw new Error("Unauthorized: You don't own this goal")
  }

  // Delete the milestone
  const { error } = await supabase.from("milestones").delete().eq("id", milestoneId)

  if (error) {
    console.error("Error deleting milestone:", error)
    throw error
  }
}
