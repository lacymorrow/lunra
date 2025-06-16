"use client"

import { supabase } from '@/lib/supabase'
import type { DatabaseSubscription, DatabaseUserProfile } from '@/types/database'

export async function getUserSubscriptionClient(userId: string): Promise<DatabaseSubscription | null> {
    const { data, error } = await supabase()
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (error) {
        console.error('Error fetching user subscription:', error)
        return null
    }

    return data
}

export async function getUserProfileClient(userId: string): Promise<DatabaseUserProfile | null> {
    const { data, error } = await supabase()
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (error) {
        console.error('Error fetching user profile:', error)
        return null
    }

    return data
}

export async function createUserProfileClient(
    userId: string,
    profileData: Partial<Omit<DatabaseUserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<DatabaseUserProfile | null> {
    const { data, error } = await supabase()
        .from('user_profiles')
        .insert({
            user_id: userId,
            plan_id: 'seedling',
            goals_limit: 3,
            ...profileData,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating user profile:', error)

        // If it's a duplicate key error, try to fetch the existing profile
        if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('already exists')) {
            console.log('🔍 [createUserProfileClient] Profile likely already exists, attempting to fetch existing profile')
            return await getUserProfileClient(userId)
        }

        return null
    }

    return data
}
