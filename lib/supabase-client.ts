import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client for use in Client Components
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Legacy support - maintain backward compatibility with existing code
export const supabase = createClient