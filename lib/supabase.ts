import { createBrowserClient } from "@supabase/ssr"

// Check if Supabase is configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Create a single supabase client for the browser with proper SSR cookie handling
export const createClientBrowser = () => {
	if (!isSupabaseConfigured) {
		return null
	}
	return createBrowserClient(supabaseUrl!, supabaseAnonKey!)
}

// Client-side singleton with proper SSR handling
// IMPORTANT: This should ONLY return browser clients, never the service role client.
// Server-side code should import from supabase-server.ts directly.
let browserClient: ReturnType<typeof createClientBrowser> | null = null

export const supabase = () => {
	if (typeof window === "undefined") {
		// During SSR of client components, return null instead of a service-role client.
		// Client components should not make Supabase calls during SSR.
		// Server-side code should use supabase-server.ts imports directly.
		return null as any
	}

	if (!isSupabaseConfigured) {
		return null as any
	}

	// Client-side: use singleton pattern with SSR-compatible client
	if (!browserClient) {
		browserClient = createClientBrowser()
	}
	return browserClient
}
