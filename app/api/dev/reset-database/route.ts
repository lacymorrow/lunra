import { createClientServer } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
	console.log('🔄 [reset-database] Starting database reset')

	// Only allow in development
	if (process.env.NODE_ENV !== 'development') {
		console.error('❌ [reset-database] Reset only allowed in development')
		return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 })
	}

	try {
		const body = await request.json()
		const { confirm } = body

		if (confirm !== 'RESET_DATABASE') {
			console.error('❌ [reset-database] Invalid confirmation')
			return NextResponse.json({ error: 'Invalid confirmation' }, { status: 400 })
		}

		console.log('🔍 [reset-database] Environment check:', {
			hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
			hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
			nodeEnv: process.env.NODE_ENV,
		})

		// Create admin client
		console.log('🔑 [reset-database] Creating admin Supabase client...')
		const supabase = createClientServer()

		console.log('🗑️ [reset-database] Deleting all data...')

		// Delete data in the correct order (respecting foreign key constraints)

		// 1. Delete milestones first (they reference goals)
		console.log('🔄 [reset-database] Deleting milestones...')
		const { error: milestonesError } = await supabase
			.from('milestones')
			.delete()
			.gte('id', '00000000-0000-0000-0000-000000000000') // Delete all

		if (milestonesError && milestonesError.code !== 'PGRST116') { // PGRST116 = no rows found
			console.error('❌ [reset-database] Error deleting milestones:', milestonesError)
		}

		// 2. Delete goals
		console.log('🔄 [reset-database] Deleting goals...')
		const { error: goalsError } = await supabase
			.from('goals')
			.delete()
			.gte('id', '00000000-0000-0000-0000-000000000000') // Delete all

		if (goalsError && goalsError.code !== 'PGRST116') {
			console.error('❌ [reset-database] Error deleting goals:', goalsError)
		}

		// 3. Delete subscriptions
		console.log('🔄 [reset-database] Deleting subscriptions...')
		const { error: subscriptionsError } = await supabase
			.from('subscriptions')
			.delete()
			.gte('id', '00000000-0000-0000-0000-000000000000') // Delete all

		if (subscriptionsError && subscriptionsError.code !== 'PGRST116') {
			console.error('❌ [reset-database] Error deleting subscriptions:', subscriptionsError)
		}

		// 4. Delete user profiles
		console.log('🔄 [reset-database] Deleting user profiles...')
		const { error: profilesError } = await supabase
			.from('user_profiles')
			.delete()
			.gte('id', '00000000-0000-0000-0000-000000000000') // Delete all

		if (profilesError && profilesError.code !== 'PGRST116') {
			console.error('❌ [reset-database] Error deleting user profiles:', profilesError)
		}

		// 5. Delete auth users (this requires admin privileges)
		console.log('🔄 [reset-database] Deleting auth users...')
		try {
			// List all users
			const { data: users, error: listError } = await supabase.auth.admin.listUsers()

			if (listError) {
				console.error('❌ [reset-database] Error listing users:', listError)
			} else if (users?.users) {
				// Delete each user
				for (const user of users.users) {
					const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
					if (deleteError) {
						console.error(`❌ [reset-database] Error deleting user ${user.id}:`, deleteError)
					}
				}
			}
		} catch (authError) {
			console.error('❌ [reset-database] Error with auth operations:', authError)
		}

		console.log('✅ [reset-database] Database reset completed')

		console.log('✅ [reset-database] Data cleanup completed')

		return NextResponse.json({
			success: true,
			message: 'Database reset successfully. All user data has been cleared.'
		})

	} catch (error) {
		console.error('💥 [reset-database] Error resetting database:', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		})
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
