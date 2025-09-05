-- Temporarily disable RLS on messages table to test Realtime
-- This is just for testing - we'll re-enable it after

-- 1. Check current RLS status
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN 'RLS is ENABLED'
    ELSE 'RLS is DISABLED'
  END as current_rls_status
FROM pg_tables 
WHERE tablename = 'messages';

-- 2. Disable RLS on messages table (temporarily for testing)
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- 3. Confirm RLS is now disabled
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN 'RLS is ENABLED'
    ELSE 'RLS is DISABLED - Ready for Realtime test!'
  END as new_rls_status
FROM pg_tables 
WHERE tablename = 'messages';
