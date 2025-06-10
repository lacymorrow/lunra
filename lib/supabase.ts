import { createBrowserClient } from "@supabase/ssr"

// Create a single supabase client for the browser
export const createClientBrowser = () => {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

	console.log('🔍 [createClientBrowser] Environment check:', {
		hasUrl: !!supabaseUrl,
		hasAnonKey: !!supabaseAnonKey,
		urlLength: supabaseUrl?.length || 0,
		anonKeyLength: supabaseAnonKey?.length || 0,
	})

	if (!supabaseUrl) {
		console.error('❌ [createClientBrowser] NEXT_PUBLIC_SUPABASE_URL is missing')
		throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
	}

	if (!supabaseAnonKey) {
		console.error('❌ [createClientBrowser] NEXT_PUBLIC_SUPABASE_ANON_KEY is missing')
		throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
	}

	console.log('✅ [createClientBrowser] Creating browser client')
	return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Client-side singleton
let browserClient: ReturnType<typeof createClientBrowser> | null = null

export const supabase = () => {
	console.log('🔍 [supabase] Called from:', typeof window === "undefined" ? 'server' : 'client')

	if (typeof window === "undefined") {
		// Server-side: This should not be used for authenticated requests
		// Use functions from lib/supabase-server.ts instead
		console.warn('⚠️ [supabase] Server-side usage detected. Consider using lib/supabase-server.ts for authenticated requests')
		return createClientBrowser() // Fallback for server components that need basic access
	}

	// Client-side: use singleton pattern
	if (!browserClient) {
		console.log('🔍 [supabase] Creating new browser client singleton')
		browserClient = createClientBrowser()
	} else {
		console.log('🔍 [supabase] Using existing browser client singleton')
	}
	return browserClient
}
