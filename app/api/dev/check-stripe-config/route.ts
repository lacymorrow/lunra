import { stripe } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
	console.log('🔍 [check-stripe-config] Checking Stripe configuration...')

	const priceId = process.env.STRIPE_BLOOM_PRICE_ID

	console.log('🔍 [check-stripe-config] Environment check:', {
		hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
		hasBloomPriceId: !!process.env.STRIPE_BLOOM_PRICE_ID,
		bloomPriceId: process.env.STRIPE_BLOOM_PRICE_ID?.substring(0, 20) + '...' || 'MISSING',
		nodeEnv: process.env.NODE_ENV,
	})

	if (!priceId) {
		console.error('❌ [check-stripe-config] STRIPE_BLOOM_PRICE_ID not found')
		return NextResponse.json({
			success: false,
			error: 'STRIPE_BLOOM_PRICE_ID environment variable not set',
			suggestion: 'Add STRIPE_BLOOM_PRICE_ID to your .env.local file'
		}, { status: 400 })
	}

	try {
		console.log('💳 [check-stripe-config] Fetching price details from Stripe...')
		const price = await stripe.prices.retrieve(priceId)

		console.log('✅ [check-stripe-config] Price retrieved successfully:', {
			priceId: price.id,
			amount: price.unit_amount,
			currency: price.currency,
			active: price.active,
		})

		return NextResponse.json({
			success: true,
			price: {
				id: price.id,
				amount: price.unit_amount,
				currency: price.currency,
				active: price.active,
				recurring: price.recurring,
			},
			message: 'Stripe configuration is working correctly'
		})

	} catch (error) {
		console.error('❌ [check-stripe-config] Error retrieving price:', error)

		if (error instanceof Error && error.message.includes('No such price')) {
			console.log('🔧 [check-stripe-config] Price not found, attempting to create...')

			try {
				// Create a new price for the Bloom plan
				const newPrice = await stripe.prices.create({
					unit_amount: 900, // $9.00 in cents
					currency: 'usd',
					recurring: {
						interval: 'month',
					},
					product_data: {
						name: 'Bloom Plan',
					},
					active: true,
				})

				console.log('✅ [check-stripe-config] Created new price:', {
					priceId: newPrice.id,
					amount: newPrice.unit_amount,
				})

				return NextResponse.json({
					success: true,
					created: true,
					price: {
						id: newPrice.id,
						amount: newPrice.unit_amount,
						currency: newPrice.currency,
						active: newPrice.active,
					},
					instruction: `Update your .env.local file: STRIPE_BLOOM_PRICE_ID=${newPrice.id}`,
					message: 'Created new price. Please update your environment variable.'
				})

			} catch (createError) {
				console.error('❌ [check-stripe-config] Failed to create price:', createError)
				return NextResponse.json({
					success: false,
					error: 'Failed to create new price',
					details: createError instanceof Error ? createError.message : 'Unknown error',
					suggestion: 'Manually create a price in Stripe Dashboard and update STRIPE_BLOOM_PRICE_ID'
				}, { status: 500 })
			}
		}

		return NextResponse.json({
			success: false,
			error: 'Failed to retrieve price configuration',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 })
	}
}
