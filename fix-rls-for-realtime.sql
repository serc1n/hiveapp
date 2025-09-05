-- Fix RLS policy to work with Realtime
-- The previous policy was too restrictive

-- 1. Drop the restrictive policy
DROP POLICY IF EXISTS "Enable realtime access for authenticated users" ON messages;

-- 2. Create a more permissive policy that definitely works with Realtime
-- This allows all users to read messages (needed for Realtime to broadcast properly)
CREATE POLICY "Allow all users to read messages for realtime" ON messages
FOR SELECT USING (true);

-- 3. Verify the new policy
SELECT polname, polcmd
FROM pg_policy 
WHERE polrelid = 'messages'::regclass;

-- 4. Check RLS status
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN 'RLS is ENABLED with permissive policy ✅'
    ELSE 'RLS is DISABLED'
  END as rls_status
FROM pg_tables 
WHERE tablename = 'messages';
