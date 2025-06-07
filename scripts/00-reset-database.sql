-- WARNING: This script will drop your existing application tables and all their data.
-- Supabase auth.users table will NOT be affected.

-- Drop Stripe-related tables first due to dependencies, using CASCADE to handle foreign keys.
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.prices CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;

-- Drop Goal-planning related tables
DROP TABLE IF EXISTS public.milestones CASCADE;
DROP TABLE IF EXISTS public.goals CASCADE;

-- Note: Functions and RLS policies associated with these tables might be dropped by CASCADE.
-- It's best to re-run the scripts that create them after recreating the tables.

RAISE NOTICE 'Application tables dropped successfully. Please re-run your schema creation scripts.';
