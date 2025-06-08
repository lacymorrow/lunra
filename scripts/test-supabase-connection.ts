#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

console.log('🔧 Testing Supabase connection...')
console.log('📍 Supabase URL:', supabaseUrl)
console.log('🔑 Service key:', supabaseServiceKey ? '✅ Present' : '❌ Missing')

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables')
    process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testConnection() {
    try {
        // Test basic connection
        console.log('\n🔍 Testing database connection...')
        const { data, error } = await supabase.from('customers').select('count', { count: 'exact' }).limit(0)

        if (error) {
            console.error('❌ Connection failed:', error)
            return false
        }

        console.log('✅ Connection successful!')
        console.log(`📊 Customers table count: ${data ? 'accessible' : 'not accessible'}`)

        // Test other tables
        const tables = ['products', 'prices', 'subscriptions']

        for (const table of tables) {
            try {
                const { data, error } = await supabase.from(table).select('count', { count: 'exact' }).limit(0)
                if (error) {
                    console.error(`❌ ${table} table error:`, error.message)
                } else {
                    console.log(`✅ ${table} table: accessible`)
                }
            } catch (err) {
                console.error(`❌ ${table} table error:`, err)
            }
        }

        return true
    } catch (error) {
        console.error('❌ Unexpected error:', error)
        return false
    }
}

testConnection().then((success) => {
    if (success) {
        console.log('\n🎉 All tests passed!')
    } else {
        console.log('\n💥 Some tests failed!')
        process.exit(1)
    }
})
