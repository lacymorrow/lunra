import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    console.log('🔧 [fix-webhook-validation] TEMPORARY FIX: Disabling webhook validation')

    // This is a temporary development fix
    // DO NOT USE IN PRODUCTION

    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({
            error: 'This endpoint is only available in development mode',
            message: 'Use proper webhook configuration in production'
        }, { status: 403 })
    }

    // For development, we can set a dummy webhook secret
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_development_only_dummy_secret'

    console.log('⚠️ [fix-webhook-validation] WARNING: Using dummy webhook secret for development')
    console.log('⚠️ [fix-webhook-validation] This bypasses webhook security - DO NOT USE IN PRODUCTION')

    return NextResponse.json({
        success: true,
        message: 'Webhook validation temporarily disabled for development',
        warning: 'This is not secure - set up proper webhooks for production',
        nextSteps: [
            'Test your payment flow now',
            'Set up proper webhook configuration for production',
            'Add STRIPE_WEBHOOK_SECRET to your environment variables'
        ]
    })
}
