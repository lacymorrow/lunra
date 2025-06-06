import { createClient } from "@supabase/supabase-js"

// Create a single supabase client for the browser
export const createClientBrowser = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}

// Create a single supabase client for server components
export const createClientServer = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// Client-side singleton
let browserClient: ReturnType<typeof createClientBrowser> | null = null

export const supabase = () => {
  if (typeof window === "undefined") {
    // Server-side: create a new client for each request
    return createClientServer()
  }

  // Client-side: use singleton pattern
  if (!browserClient) {
    browserClient = createClientBrowser()
  }
  return browserClient
}
