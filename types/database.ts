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

// Extended type that includes milestone data
export interface DatabaseGoalWithMilestones extends DatabaseGoal {
  milestones: DatabaseMilestone[]
  total_milestones?: number
  completed_milestones?: number
}

// Conversion functions between localStorage format and database format
export function convertLocalStorageToDatabase(
  localGoal: any,
): Omit<DatabaseGoal, "id" | "user_id" | "created_at" | "updated_at"> {
  return {
    title: localGoal.title,
    description: localGoal.description || null,
    timeline: localGoal.timeline || null,
    progress: localGoal.progress || 0,
    status: localGoal.status || "in-progress",
    due_date: localGoal.dueDate || null,
    sub_goals: localGoal.subGoals || [],
    completed_sub_goals: localGoal.completedSubGoals || 0,
  }
}

export function convertDatabaseToLocalStorage(dbGoal: DatabaseGoalWithMilestones): any {
  return {
    id: Number.parseInt(dbGoal.id.replace(/-/g, "").substring(0, 10), 16), // Convert UUID to number for compatibility
    title: dbGoal.title,
    description: dbGoal.description || "",
    timeline: dbGoal.timeline || "",
    progress: dbGoal.progress,
    status: dbGoal.status,
    dueDate: dbGoal.due_date || "",
    subGoals: dbGoal.sub_goals,
    completedSubGoals: dbGoal.completed_sub_goals,
    createdAt: dbGoal.created_at,
    milestones:
      dbGoal.milestones?.map((m) => ({
        week: m.week,
        task: m.task,
        status: m.status,
        progress: m.progress,
      })) || [],
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
    }
  }
}
