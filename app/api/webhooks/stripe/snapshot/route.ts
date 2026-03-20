import { handleStripeEvent } from '@/lib/stripe-webhook-handler'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
	const body = await request.text()
	const signature = (await headers()).get('stripe-signature')
	const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_SNAP

	if (!webhookSecret) {
		console.error('[webhook-snapshot] STRIPE_WEBHOOK_SECRET_SNAP not configured')
		return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
	}

	if (!signature) {
		return NextResponse.json({ error: 'No signature' }, { status: 400 })
	}

	let event: Stripe.Event
	try {
		event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
	} catch (err) {
		console.error('[webhook-snapshot] Signature verification failed:', err)
		return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
	}

	try {
		await handleStripeEvent(event, 'webhook-snapshot')
		return NextResponse.json({ received: true, endpoint: 'snapshot' })
	} catch (error) {
		console.error('[webhook-snapshot] Error processing event:', error)
		return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
	}
}
