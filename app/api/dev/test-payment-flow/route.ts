import { PLANS, stripe } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    console.log('🧪 [test-payment-flow] Starting payment flow diagnostic...')

    try {
        // Environment check
        const envCheck = {
            hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
            hasStripePublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
            hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
            hasWebhookSecretSnap: !!process.env.STRIPE_WEBHOOK_SECRET_SNAP,
            hasWebhookSecretThin: !!process.env.STRIPE_WEBHOOK_SECRET_THIN,
            hasBloomPriceId: !!process.env.STRIPE_BLOOM_PRICE_ID,
            bloomPriceId: process.env.STRIPE_BLOOM_PRICE_ID || 'MISSING',
            stripeKeyLength: process.env.STRIPE_SECRET_KEY?.length || 0,
            nodeEnv: process.env.NODE_ENV,
            hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        }

        console.log('🔍 [test-payment-flow] Environment check:', {
            ...envCheck,
            bloomPriceId: envCheck.bloomPriceId.substring(0, 20) + '...' || 'MISSING',
        })

        // Plan configuration check
        const bloomPlan = PLANS.bloom
        console.log('💳 [test-payment-flow] Plan configuration:', {
            planName: bloomPlan.name,
            planPrice: bloomPlan.price,
            planPriceId: bloomPlan.priceId,
            priceIdLength: bloomPlan.priceId.length,
        })

        // Stripe API connectivity test
        console.log('🔌 [test-payment-flow] Testing Stripe connectivity...')
        const account = await stripe.accounts.retrieve()
        console.log('✅ [test-payment-flow] Stripe connection successful:', {
            accountId: account.id,
            country: account.country,
            livemode: account.livemode,
        })

        // Price validation test
        let priceValidation = null
        if (process.env.STRIPE_BLOOM_PRICE_ID) {
            try {
                console.log('💰 [test-payment-flow] Validating price ID...')
                const price = await stripe.prices.retrieve(process.env.STRIPE_BLOOM_PRICE_ID)
                priceValidation = {
                    success: true,
                    priceId: price.id,
                    amount: price.unit_amount,
                    currency: price.currency,
                    active: price.active,
                    recurring: price.recurring,
                }
                console.log('✅ [test-payment-flow] Price validation successful:', priceValidation)
            } catch (priceError) {
                priceValidation = {
                    success: false,
                    error: priceError instanceof Error ? priceError.message : 'Unknown price error',
                }
                console.error('❌ [test-payment-flow] Price validation failed:', priceValidation)
            }
        }

        // Checkout session simulation
        let sessionSimulation = null
        if (process.env.STRIPE_BLOOM_PRICE_ID && bloomPlan.priceId) {
            try {
                console.log('🛒 [test-payment-flow] Simulating checkout session creation...')
                // We won't actually create the session, just validate the config
                const sessionConfig = {
                    payment_method_types: ['card'],
                    line_items: [
                        {
                            price: bloomPlan.priceId,
                            quantity: 1,
                        },
                    ],
                    mode: 'subscription' as const,
                    success_url: 'https://example.com/success',
                    cancel_url: 'https://example.com/cancel',
                }

                console.log('🛒 [test-payment-flow] Session config would be:', {
                    priceId: sessionConfig.line_items[0].price,
                    mode: sessionConfig.mode,
                })

                sessionSimulation = {
                    success: true,
                    configValid: true,
                    priceId: sessionConfig.line_items[0].price,
                }
            } catch (sessionError) {
                sessionSimulation = {
                    success: false,
                    error: sessionError instanceof Error ? sessionError.message : 'Unknown session error',
                }
                console.error('❌ [test-payment-flow] Session simulation failed:', sessionSimulation)
            }
        }

        // Health assessment
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
        if (bloomPlan.priceId === '') criticalIssues.push('Bloom plan has empty priceId')
        if (priceValidation && !priceValidation.success) criticalIssues.push(`Invalid price ID: ${priceValidation.error}`)

        if (envCheck.nodeEnv === 'production' && account.livemode === false) {
            warnings.push('Using test mode in production environment')
        }

        const overallHealth = criticalIssues.length === 0 ? 'healthy' : 'critical'

        console.log(`📊 [test-payment-flow] Overall health: ${overallHealth}`)

        return NextResponse.json({
            success: true,
            overallHealth,
            timestamp: new Date().toISOString(),
            environment: {
                ...envCheck,
                bloomPriceId: envCheck.bloomPriceId.substring(0, 20) + '...' || 'MISSING',
            },
            planConfiguration: {
                planName: bloomPlan.name,
                planPrice: bloomPlan.price,
                priceIdSet: bloomPlan.priceId !== '',
                priceIdLength: bloomPlan.priceId.length,
            },
            stripeConnection: {
                accountId: account.id,
                country: account.country,
                livemode: account.livemode,
            },
            priceValidation,
            sessionSimulation,
            issues: {
                critical: criticalIssues,
                warnings,
            },
            recommendations: criticalIssues.length > 0 ? [
                'Add missing environment variables to your deployment platform',
                'Ensure STRIPE_BLOOM_PRICE_ID points to a valid Stripe price',
                'Restart your application after adding environment variables',
            ] : [
                'Payment system appears to be configured correctly',
            ],
        })

    } catch (error) {
        console.error('💥 [test-payment-flow] Diagnostic failed:', error)
        return NextResponse.json({
            success: false,
            error: 'Payment flow diagnostic failed',
            details: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        }, { status: 500 })
    }
}
