import type { SavedGoal } from "@/types"

// Database types that match our Supabase schema
export interface DatabaseGoal {
  id: string
  user_id: string
  title: string
  description: string | null
  timeline: string | null
  progress: number
  status: "in-progress" | "on-track" | "behind" | "completed" | "paused"
  due_date: string | null
  sub_goals: string[] // JSONB array
  completed_sub_goals: number
  created_at: string
  updated_at: string
}

export interface DatabaseMilestone {
  id: string
  goal_id: string
  week: number
  task: string
  status: "pending" | "in-progress" | "completed"
  progress: number
  created_at: string
  updated_at: string
}

// New subscription types
export interface DatabaseSubscription {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string | null
  plan_id: "seedling" | "bloom"
  status: "active" | "canceled" | "past_due" | "unpaid" | "incomplete"
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export interface DatabaseUserProfile {
  id: string
  user_id: string
  full_name: string | null
  avatar_url: string | null
  plan_id: "seedling" | "bloom"
  goals_limit: number
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
}

// Extended type that includes milestone data
export interface DatabaseGoalWithMilestones extends DatabaseGoal {
  milestones: DatabaseMilestone[]
  total_milestones?: number
  completed_milestones?: number
}

// Convert a full SavedGoal to database format (for creates and full updates)
export function convertLocalStorageToDatabase(
  localGoal: Partial<SavedGoal>,
): Omit<DatabaseGoal, "id" | "user_id" | "created_at" | "updated_at"> {
  return {
    title: localGoal.title ?? "",
    description: localGoal.description || null,
    timeline: localGoal.timeline || null,
    progress: localGoal.progress ?? 0,
    status: (localGoal.status as DatabaseGoal["status"]) ?? "in-progress",
    due_date: localGoal.dueDate || null,
    sub_goals: localGoal.subGoals ?? [],
    completed_sub_goals: localGoal.completedSubGoals ?? 0,
  }
}

// Convert a partial SavedGoal to partial database format (for partial updates only)
export function convertPartialLocalStorageToDatabase(
  localGoal: Partial<SavedGoal>,
): Partial<Omit<DatabaseGoal, "id" | "user_id" | "created_at" | "updated_at">> {
  const result: Record<string, unknown> = {}
  if (localGoal.title !== undefined) result.title = localGoal.title
  if (localGoal.description !== undefined) result.description = localGoal.description || null
  if (localGoal.timeline !== undefined) result.timeline = localGoal.timeline || null
  if (localGoal.progress !== undefined) result.progress = localGoal.progress
  if (localGoal.status !== undefined) result.status = localGoal.status
  if (localGoal.dueDate !== undefined) result.due_date = localGoal.dueDate || null
  if (localGoal.subGoals !== undefined) result.sub_goals = localGoal.subGoals
  if (localGoal.completedSubGoals !== undefined) result.completed_sub_goals = localGoal.completedSubGoals
  return result as Partial<Omit<DatabaseGoal, "id" | "user_id" | "created_at" | "updated_at">>
}

// Generate a stable numeric ID from a UUID using a simple hash.
// This avoids collisions from the old substring approach.
function hashUuidToNumber(uuid: string): number {
  const hex = uuid.replace(/-/g, "")
  let hash = 0
  for (let i = 0; i < hex.length; i++) {
    hash = ((hash << 5) - hash + hex.charCodeAt(i)) | 0
  }
  // Ensure positive value within safe integer range
  return Math.abs(hash)
}

export function convertDatabaseToLocalStorage(dbGoal: DatabaseGoalWithMilestones): SavedGoal {
  return {
    id: hashUuidToNumber(dbGoal.id),
    dbId: dbGoal.id, // Preserve the real UUID for sync operations
    title: dbGoal.title,
    description: dbGoal.description ?? "",
    timeline: dbGoal.timeline ?? "",
    progress: dbGoal.progress,
    status: dbGoal.status,
    dueDate: dbGoal.due_date ?? "",
    subGoals: dbGoal.sub_goals,
    completedSubGoals: dbGoal.completed_sub_goals,
    createdAt: dbGoal.created_at,
    milestones:
      dbGoal.milestones?.map((m) => ({
        week: m.week,
        task: m.task,
        status: m.status,
        progress: m.progress,
      })) ?? [],
  }
}

// Supabase Database type definitions
export interface Database {
  public: {
    Tables: {
      goals: {
        Row: DatabaseGoal
        Insert: Omit<DatabaseGoal, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<DatabaseGoal, "id" | "user_id" | "created_at" | "updated_at">>
      }
      milestones: {
        Row: DatabaseMilestone
        Insert: Omit<DatabaseMilestone, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<DatabaseMilestone, "id" | "goal_id" | "created_at" | "updated_at">>
      }
      subscriptions: {
        Row: DatabaseSubscription
        Insert: Omit<DatabaseSubscription, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<DatabaseSubscription, "id" | "user_id" | "created_at" | "updated_at">>
      }
      user_profiles: {
        Row: DatabaseUserProfile
        Insert: Omit<DatabaseUserProfile, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<DatabaseUserProfile, "id" | "user_id" | "created_at" | "updated_at">>
      }
    }
    Functions: {
      get_user_goals_with_stats: {
        Args: { user_uuid: string }
        Returns: DatabaseGoalWithMilestones[]
      }
      update_goal_progress: {
        Args: { goal_uuid: string }
        Returns: void
      }
      get_user_subscription: {
        Args: { user_uuid: string }
        Returns: DatabaseSubscription | null
      }
    }
  }
}
