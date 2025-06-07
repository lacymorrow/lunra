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

// Stripe-related database types
export interface DatabaseCustomer {
  id: string // User UUID from auth.users
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
}

export interface DatabaseProduct {
  id: string // Product ID from Stripe
  active: boolean | null
  name: string | null
  description: string | null
  image: string | null
  metadata: Record<string, any> | null // JSONB
  created_at: string
  updated_at: string
}

export interface DatabasePrice {
  id: string // Price ID from Stripe
  product_id: string | null
  active: boolean | null
  description: string | null
  unit_amount: number | null // amount in cents/smallest unit
  currency: string | null
  type: "one_time" | "recurring" | null
  interval: "day" | "week" | "month" | "year" | null
  interval_count: number | null
  trial_period_days: number | null
  metadata: Record<string, any> | null // JSONB
  created_at: string
  updated_at: string
}

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "past_due"
  | "unpaid"
  | "paused"

export interface DatabaseSubscription {
  id: string // Subscription ID from Stripe
  user_id: string // User UUID
  status: SubscriptionStatus | null
  metadata: Record<string, any> | null // JSONB
  price_id: string | null
  quantity: number | null
  cancel_at_period_end: boolean | null
  created: string // Stripe timestamp
  current_period_start: string // Stripe timestamp
  current_period_end: string // Stripe timestamp
  ended_at: string | null // Stripe timestamp
  cancel_at: string | null // Stripe timestamp
  canceled_at: string | null // Stripe timestamp
  trial_start: string | null // Stripe timestamp
  trial_end: string | null // Stripe timestamp
  created_at: string // Local record created_at
  updated_at: string // Local record updated_at
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
      // Stripe tables
      customers: {
        Row: DatabaseCustomer
        Insert: Omit<DatabaseCustomer, "created_at" | "updated_at">
        Update: Partial<Omit<DatabaseCustomer, "id" | "created_at" | "updated_at">>
      }
      products: {
        Row: DatabaseProduct
        Insert: Omit<DatabaseProduct, "created_at" | "updated_at">
        Update: Partial<Omit<DatabaseProduct, "id" | "created_at" | "updated_at">>
      }
      prices: {
        Row: DatabasePrice
        Insert: Omit<DatabasePrice, "created_at" | "updated_at">
        Update: Partial<Omit<DatabasePrice, "id" | "created_at" | "updated_at">>
      }
      subscriptions: {
        Row: DatabaseSubscription
        Insert: Omit<DatabaseSubscription, "created_at" | "updated_at">
        Update: Partial<Omit<DatabaseSubscription, "id" | "user_id" | "created_at" | "updated_at">>
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
