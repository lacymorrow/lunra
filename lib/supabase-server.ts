import "server-only"

import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// Create a supabase client for server-side API routes with user authentication
export const createClientServerWithAuth = (request: NextRequest, response?: NextResponse) => {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

	console.log('🔍 [createClientServerWithAuth] Environment check:', {
		hasUrl: !!supabaseUrl,
		hasAnonKey: !!supabaseAnonKey,
		urlLength: supabaseUrl?.length || 0,
		anonKeyLength: supabaseAnonKey?.length || 0,
	})

	if (!supabaseUrl) {
		console.error('❌ [createClientServerWithAuth] NEXT_PUBLIC_SUPABASE_URL is missing')
		throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
	}

	if (!supabaseAnonKey) {
		console.error('❌ [createClientServerWithAuth] NEXT_PUBLIC_SUPABASE_ANON_KEY is missing')
		throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
	}

	console.log('✅ [createClientServerWithAuth] Creating server client with auth')

	return createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				const cookies = request.cookies.getAll().map(cookie => ({
					name: cookie.name,
					value: cookie.value
				}));
				console.log('🍪 [createClientServerWithAuth] Getting cookies:', cookies.map(c => c.name));
				return cookies;
			},
			setAll(cookiesToSet) {
				console.log('🍪 [createClientServerWithAuth] Setting cookies:', cookiesToSet.map(c => c.name));
				// Store cookies to be set in response (handled by the caller)
				if (response) {
					cookiesToSet.forEach(({ name, value, options }) => {
						response.cookies.set(name, value, options);
					});
				}
			},
		},
	})
}

// Create a single supabase client for server components (admin/service role)
export const createClientServer = () => {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
	const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

	console.log('🔍 [createClientServer] Environment check:', {
		hasUrl: !!supabaseUrl,
		hasServiceKey: !!supabaseServiceKey,
		urlLength: supabaseUrl?.length || 0,
		serviceKeyLength: supabaseServiceKey?.length || 0,
		nodeEnv: process.env.NODE_ENV,
	})

	if (!supabaseUrl) {
		console.error('❌ [createClientServer] NEXT_PUBLIC_SUPABASE_URL is missing')
		throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
	}

	if (!supabaseServiceKey) {
		console.error('❌ [createClientServer] SUPABASE_SERVICE_ROLE_KEY is missing')
		throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
	}

	console.log('✅ [createClientServer] Creating server client')
	return createClient(supabaseUrl, supabaseServiceKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
		},
	})
}
