-- Script to drop application-specific tables for a fresh start.
-- WARNING: This will delete all data in these tables.
-- This script DOES NOT affect the auth.users table or other Supabase-managed schemas.

-- Drop tables with dependencies first, using CASCADE to handle related objects.

RAISE NOTICE 'Dropping application tables...';

DROP TABLE IF EXISTS public.milestones CASCADE;
RAISE NOTICE 'Table public.milestones dropped (if existed).';

DROP TABLE IF EXISTS public.goals CASCADE;
RAISE NOTICE 'Table public.goals dropped (if existed).';

DROP TABLE IF EXISTS public.subscriptions CASCADE;
RAISE NOTICE 'Table public.subscriptions dropped (if existed).';

DROP TABLE IF EXISTS public.prices CASCADE;
RAISE NOTICE 'Table public.prices dropped (if existed).';

DROP TABLE IF EXISTS public.products CASCADE;
RAISE NOTICE 'Table public.products dropped (if existed).';

DROP TABLE IF EXISTS public.customers CASCADE;
RAISE NOTICE 'Table public.customers dropped (if existed).';

-- Note: Functions like update_updated_at_column and trigger_update_goal_progress
-- were created in specific schema scripts. If they were general, they might need
-- explicit dropping. However, since they are re-created with CREATE OR REPLACE
-- in subsequent scripts, this should be fine.

RAISE NOTICE 'All specified application tables have been dropped.';
RAISE NOTICE 'Please proceed to re-run your schema creation and setup scripts.';
