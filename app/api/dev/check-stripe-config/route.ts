import { stripe } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    console.log('🔍 [check-stripe-config] Checking Stripe configuration')

    try {
        const priceId = process.env.STRIPE_BLOOM_PRICE_ID

        console.log('🔍 [check-stripe-config] Environment check:', {
            hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
            hasBloomPriceId: !!priceId,
            bloomPriceId: priceId,
        })

        if (!priceId) {
            return NextResponse.json({
                error: 'STRIPE_BLOOM_PRICE_ID environment variable not set',
                suggestion: 'Add STRIPE_BLOOM_PRICE_ID to your .env.local file'
            }, { status: 400 })
        }

        // Try to retrieve the price
        try {
            const price = await stripe.prices.retrieve(priceId)

            console.log('✅ [check-stripe-config] Price found:', {
                id: price.id,
                active: price.active,
                currency: price.currency,
                unitAmount: price.unit_amount,
                type: price.type,
                recurring: price.recurring,
            })

            return NextResponse.json({
                success: true,
                price: {
                    id: price.id,
                    active: price.active,
                    currency: price.currency,
                    unitAmount: price.unit_amount,
                    type: price.type,
                    recurring: price.recurring,
                },
                message: 'Price configuration is correct!'
            })

        } catch (error: any) {
            console.error('❌ [check-stripe-config] Price not found:', error.message)

            // If price doesn't exist, let's try to create it
            console.log('🔧 [check-stripe-config] Attempting to create price...')

            try {
                // First create a product
                const product = await stripe.products.create({
                    name: 'Bloom Plan',
                    description: 'Advanced AI mentorship with unlimited goals',
                })

                console.log('✅ [check-stripe-config] Created product:', product.id)

                // Then create the price
                const newPrice = await stripe.prices.create({
                    currency: 'usd',
                    unit_amount: 900, // $9.00 in cents
                    recurring: {
                        interval: 'month',
                    },
                    product: product.id,
                })

                console.log('✅ [check-stripe-config] Created price:', newPrice.id)

                return NextResponse.json({
                    success: true,
                    created: true,
                    newPriceId: newPrice.id,
                    message: `Created new price: ${newPrice.id}`,
                    instruction: `Update your .env.local file: STRIPE_BLOOM_PRICE_ID=${newPrice.id}`
                })

            } catch (createError: any) {
                console.error('❌ [check-stripe-config] Failed to create price:', createError.message)

                return NextResponse.json({
                    error: 'Price not found and failed to create new one',
                    details: createError.message,
                    suggestion: 'Manually create a price in Stripe Dashboard and update STRIPE_BLOOM_PRICE_ID'
                }, { status: 500 })
            }
        }

    } catch (error: any) {
        console.error('❌ [check-stripe-config] Error:', error.message)
        return NextResponse.json({
            error: 'Failed to check Stripe configuration',
            details: error.message
        }, { status: 500 })
    }
}
