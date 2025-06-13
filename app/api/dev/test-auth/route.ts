import { createClientServerWithAuth } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    console.log('🧪 [test-auth] Testing authentication status')

    try {
        // Get all request cookies for debugging
        const allCookies = request.cookies.getAll()
        console.log('🍪 [test-auth] All request cookies:', allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })))

        // Create response for cookie handling
        const response = NextResponse.json({ success: true })

        // Create Supabase client
        const supabase = createClientServerWithAuth(request, response)

        // Try to get user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        console.log('🔑 [test-auth] Auth result:', {
            hasUser: !!user,
            userId: user?.id,
            userEmail: user?.email,
            authError: authError?.message,
        })

        const result = {
            timestamp: new Date().toISOString(),
            authentication: {
                hasUser: !!user,
                userId: user?.id || null,
                userEmail: user?.email || null,
                error: authError?.message || null
            },
            cookies: {
                total: allCookies.length,
                supabaseCookies: allCookies.filter(c => c.name.startsWith('sb-')).length,
                cookieNames: allCookies.map(c => c.name)
            }
        }

        return NextResponse.json(result)

    } catch (error) {
        console.error('❌ [test-auth] Error:', error)
        return NextResponse.json({
            error: 'Test failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
