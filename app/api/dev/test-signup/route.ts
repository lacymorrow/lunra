import { createClientServer } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
    }
    console.log('🧪 [test-signup] Starting signup test')

    try {
        const body = await request.json()
        const { email, password } = body

        console.log('🧪 [test-signup] Testing signup for:', email)

        // Use the server client to test signup
        const supabase = createClientServer()

        console.log('🧪 [test-signup] Created server client')

        // Test signup using admin client
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm for testing
        })

        console.log('🧪 [test-signup] Signup result:', {
            hasData: !!data,
            hasUser: !!data?.user,
            userId: data?.user?.id,
            error: error?.message,
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        // Check if profile was created by trigger
        if (data?.user) {
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', data.user.id)
                .single()

            console.log('🧪 [test-signup] Profile check:', {
                hasProfile: !!profile,
                profileId: profile?.id,
                profileError: profileError?.message,
            })
        }

        return NextResponse.json({
            success: true,
            user: data?.user,
            message: 'Signup test completed successfully'
        })

    } catch (error) {
        console.error('🧪 [test-signup] Error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
