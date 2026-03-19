import {
    getUserSubscription,
    updateSubscription,
    updateUserProfile
} from '@/lib/services/subscriptions'
import { PLANS, stripe } from '@/lib/stripe'
import { createClientServerWithAuth } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    console.log('🔄 [sync-subscription] Starting subscription sync')

    try {
        console.log('🔍 [sync-subscription] Environment variables check:', {
            hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
            hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            stripeKeyLength: process.env.STRIPE_SECRET_KEY?.length || 0,
            supabaseServiceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
        })

        // Get the authenticated user
        console.log('🔑 [sync-subscription] Creating Supabase client...')
        const supabase = createClientServerWithAuth(request)

        console.log('🔑 [sync-subscription] Getting authenticated user...')
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        console.log('🔑 [sync-subscription] Auth result:', {
            hasUser: !!user,
            userId: user?.id,
            userEmail: user?.email,
            authError: authError?.message,
        })

        if (authError) {
            console.error('❌ [sync-subscription] Auth error:', authError)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!user) {
            console.error('❌ [sync-subscription] No user found')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get current subscription from database
        console.log('📄 [sync-subscription] Getting user subscription from database...')
        const dbSubscription = await getUserSubscription(user.id)

        console.log('📄 [sync-subscription] Database subscription result:', {
            hasSubscription: !!dbSubscription,
            subscriptionId: dbSubscription?.id,
            stripeSubscriptionId: dbSubscription?.stripe_subscription_id,
            stripeCustomerId: dbSubscription?.stripe_customer_id,
            status: dbSubscription?.status,
            planId: dbSubscription?.plan_id,
        })

        if (!dbSubscription || !dbSubscription.stripe_subscription_id) {
            console.error('❌ [sync-subscription] No subscription found to sync')
            return NextResponse.json({
                error: 'No subscription found to sync'
            }, { status: 404 })
        }

        // Get latest subscription data from Stripe
        console.log('💳 [sync-subscription] Fetching subscription from Stripe:', dbSubscription.stripe_subscription_id)
        const stripeSubscription = await stripe.subscriptions.retrieve(
            dbSubscription.stripe_subscription_id
        )

        const currentItem = stripeSubscription.items.data[0]

        console.log('💳 [sync-subscription] Stripe subscription data:', {
            id: stripeSubscription.id,
            status: stripeSubscription.status,
            customerId: stripeSubscription.customer,
            currentPeriodStart: currentItem?.current_period_start,
            currentPeriodEnd: currentItem?.current_period_end,
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            itemsCount: stripeSubscription.items.data.length,
            priceId: currentItem?.price?.id,
        })

        // Update database with latest Stripe data
        console.log('📝 [sync-subscription] Updating subscription in database...')
        const updateData = {
            status: stripeSubscription.status as any,
            current_period_start: currentItem ? new Date(currentItem.current_period_start * 1000).toISOString() : new Date().toISOString(),
            current_period_end: currentItem ? new Date(currentItem.current_period_end * 1000).toISOString() : new Date().toISOString(),
            cancel_at_period_end: stripeSubscription.cancel_at_period_end,
        }

        console.log('📝 [sync-subscription] Update data:', updateData)
        await updateSubscription(user.id, updateData)
        console.log('✅ [sync-subscription] Updated subscription in database')

        // Update user profile if plan changed
        const planId = stripeSubscription.items.data[0]?.price?.id === PLANS.bloom.priceId ? 'bloom' : 'seedling'
        const plan = PLANS[planId]

        console.log('👤 [sync-subscription] Updating user profile:', {
            planId,
            planName: plan.name,
            goalsLimit: plan.goalsLimit,
        })

        await updateUserProfile(user.id, {
            plan_id: planId,
            goals_limit: plan.goalsLimit,
        })

        console.log('✅ [sync-subscription] Successfully synced subscription:', {
            userId: user.id,
            status: stripeSubscription.status,
            planId,
        })

        return NextResponse.json({
            success: true,
            status: stripeSubscription.status,
            plan: planId
        })

    } catch (error) {
        console.error('💥 [sync-subscription] Error syncing subscription:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        })
        return NextResponse.json(
            { error: 'Failed to sync subscription' },
            { status: 500 }
        )
    }
}
