#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const stripeSecretKey = process.env.STRIPE_SECRET_KEY!

// Initialize clients
const supabase = createClient(supabaseUrl, supabaseServiceKey)
const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-04-10' })

async function syncStripeProducts() {
    console.log('🔄 Starting Stripe products sync...')

    try {
        // Fetch all products from Stripe
        const products = await stripe.products.list({ active: true, limit: 100 })
        console.log(`📦 Found ${products.data.length} products in Stripe`)

        for (const product of products.data) {
            // Insert/update product in Supabase
            const { error: productError } = await supabase
                .from('products')
                .upsert({
                    id: product.id,
                    active: product.active,
                    name: product.name,
                    description: product.description,
                    image: product.images?.[0] || null,
                    metadata: product.metadata,
                }, { onConflict: 'id' })

            if (productError) {
                console.error(`❌ Error syncing product ${product.id}:`, productError)
                continue
            }

            console.log(`✅ Synced product: ${product.name}`)

            // Fetch and sync prices for this product
            const prices = await stripe.prices.list({ product: product.id, active: true })

            for (const price of prices.data) {
                const { error: priceError } = await supabase
                    .from('prices')
                    .upsert({
                        id: price.id,
                        product_id: price.product as string,
                        active: price.active,
                        description: price.nickname || null,
                        unit_amount: price.unit_amount,
                        currency: price.currency,
                        type: price.type,
                        interval: price.recurring?.interval || null,
                        interval_count: price.recurring?.interval_count || null,
                        trial_period_days: price.recurring?.trial_period_days || null,
                        metadata: price.metadata,
                    }, { onConflict: 'id' })

                if (priceError) {
                    console.error(`❌ Error syncing price ${price.id}:`, priceError)
                } else {
                    console.log(`  💰 Synced price: ${price.id} (${price.unit_amount}${price.currency})`)
                }
            }
        }

        console.log('✅ Stripe products sync completed!')
    } catch (error) {
        console.error('❌ Error during sync:', error)
        process.exit(1)
    }
}

// Run the sync
syncStripeProducts()
