import { getUserProfile, getUserSubscription } from '@/lib/services/subscriptions'
import { PLANS, stripe } from '@/lib/stripe'
import { createClientServerWithAuth } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    console.log('🧪 [test-payment-flow] Starting payment flow verification')

    try {
        // 1. Check environment variables
        const envCheck = {
            hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
            hasStripePublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
            hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
            hasWebhookSecretSnap: !!process.env.STRIPE_WEBHOOK_SECRET_SNAP,
            hasWebhookSecretThin: !!process.env.STRIPE_WEBHOOK_SECRET_THIN,
            hasBloomPriceId: !!process.env.STRIPE_BLOOM_PRICE_ID,
            hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        }

        console.log('🔧 [test-payment-flow] Environment variables:', envCheck)

        // 2. Test Stripe connection
        let stripeConnectionStatus = 'unknown'
        let bloomPriceValid = false

        try {
            await stripe.customers.list({ limit: 1 })
            stripeConnectionStatus = 'connected'

            // Test the bloom price
            if (process.env.STRIPE_BLOOM_PRICE_ID) {
                const price = await stripe.prices.retrieve(process.env.STRIPE_BLOOM_PRICE_ID)
                bloomPriceValid = price.active && price.unit_amount === 900
                console.log('💰 [test-payment-flow] Bloom price check:', {
                    id: price.id,
                    active: price.active,
                    unitAmount: price.unit_amount,
                    valid: bloomPriceValid
                })
            }
        } catch (error) {
            stripeConnectionStatus = 'failed'
            console.error('❌ [test-payment-flow] Stripe connection failed:', error)
        }

        // 3. Check authenticated user (if available)
        let userCheck = null
        try {
            const supabase = createClientServerWithAuth(request)
            const { data: { user }, error: authError } = await supabase.auth.getUser()

            if (user && !authError) {
                const profile = await getUserProfile(user.id)
                const subscription = await getUserSubscription(user.id)

                userCheck = {
                    authenticated: true,
                    userId: user.id,
                    email: user.email,
                    hasProfile: !!profile,
                    planId: profile?.plan_id || 'none',
                    goalsLimit: profile?.goals_limit || 0,
                    hasSubscription: !!subscription,
                    subscriptionStatus: subscription?.status || 'none',
                    stripeCustomerId: profile?.stripe_customer_id || 'none',
                    stripeSubscriptionId: subscription?.stripe_subscription_id || 'none',
                }

                console.log('👤 [test-payment-flow] User check:', userCheck)
            } else {
                userCheck = { authenticated: false, error: authError?.message }
            }
        } catch (error) {
            userCheck = { authenticated: false, error: 'Auth check failed' }
        }

        // 4. Test plan configuration
        const planCheck = {
            seedlingConfig: {
                name: PLANS.seedling.name,
                price: PLANS.seedling.price,
                goalsLimit: PLANS.seedling.goalsLimit,
                features: PLANS.seedling.features.length
            },
            bloomConfig: {
                name: PLANS.bloom.name,
                price: PLANS.bloom.price,
                priceId: PLANS.bloom.priceId,
                goalsLimit: PLANS.bloom.goalsLimit,
                features: PLANS.bloom.features.length
            }
        }

        // 5. Test webhook endpoint accessibility
        let webhookCheck = {}
        try {
            const baseUrl = request.nextUrl.origin
            webhookCheck = {
                original: `${baseUrl}/api/stripe/webhook`,
                snapshot: `${baseUrl}/api/webhooks/stripe/snapshot`,
                thin: `${baseUrl}/api/webhooks/stripe/thin`
            }
        } catch (error) {
            webhookCheck = { error: 'configuration error' }
        }

        // 6. Overall health assessment
        const criticalIssues = []
        const warnings = []

        if (!envCheck.hasStripeSecretKey) criticalIssues.push('Missing STRIPE_SECRET_KEY')
        if (!envCheck.hasStripePublishableKey) criticalIssues.push('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
        if (!envCheck.hasWebhookSecret && !envCheck.hasWebhookSecretSnap && !envCheck.hasWebhookSecretThin) {
            criticalIssues.push('Missing webhook secrets (need at least one: STRIPE_WEBHOOK_SECRET, STRIPE_WEBHOOK_SECRET_SNAP, or STRIPE_WEBHOOK_SECRET_THIN)')
        }
        if (!envCheck.hasBloomPriceId) criticalIssues.push('Missing STRIPE_BLOOM_PRICE_ID')
        if (!envCheck.hasSupabaseUrl) criticalIssues.push('Missing NEXT_PUBLIC_SUPABASE_URL')
        if (!envCheck.hasSupabaseServiceKey) criticalIssues.push('Missing SUPABASE_SERVICE_ROLE_KEY')

        if (stripeConnectionStatus !== 'connected') criticalIssues.push('Stripe connection failed')
        if (!bloomPriceValid && envCheck.hasBloomPriceId) warnings.push('Bloom price configuration issue')

        const overallHealth = criticalIssues.length === 0 ? 'healthy' : 'critical'

        const result = {
            timestamp: new Date().toISOString(),
            overallHealth,
            criticalIssues,
            warnings,
            checks: {
                environment: envCheck,
                stripe: {
                    connection: stripeConnectionStatus,
                    bloomPriceValid,
                    priceId: process.env.STRIPE_BLOOM_PRICE_ID
                },
                user: userCheck,
                plans: planCheck,
                webhook: webhookCheck
            },
            nextSteps: criticalIssues.length > 0 ? [
                'Fix critical environment variable issues',
                'Restart the development server',
                'Test payment flow again'
            ] : [
                'Test a complete payment flow',
                'Check webhook delivery in Stripe Dashboard',
                'Verify user permissions are granted correctly'
            ]
        }

        console.log('✅ [test-payment-flow] Verification complete:', result)

        return NextResponse.json(result)

    } catch (error) {
        console.error('💥 [test-payment-flow] Verification failed:', error)
        return NextResponse.json({
            error: 'Payment flow verification failed',
            details: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 })
    }
}
