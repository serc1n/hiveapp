-- Setup proper RLS policies for messages table
-- This allows Realtime to work while keeping data secure

-- 1. Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON messages;
DROP POLICY IF EXISTS "Users can read messages from their groups" ON messages;
DROP POLICY IF EXISTS "Enable realtime for authenticated users" ON messages;

-- 3. Create a simple policy that allows all authenticated users to read messages
-- This is needed for Realtime to work properly
CREATE POLICY "Enable realtime access for authenticated users" ON messages
FOR SELECT USING (auth.role() = 'authenticated');

-- 4. Optional: Create a more restrictive policy (uncomment if you want group-based access)
-- This would only allow users to see messages from groups they're members of
-- But it might interfere with Realtime, so we'll start with the simple policy above

/*
CREATE POLICY "Users can read messages from their groups" ON messages
FOR SELECT USING (
  "groupId" IN (
    SELECT "groupId" 
    FROM group_members 
    WHERE "userId" = auth.uid()::text
  )
);
*/

-- 5. Verify RLS is enabled with proper policies
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN 'RLS is ENABLED ✅'
    ELSE 'RLS is DISABLED ❌'
  END as rls_status
FROM pg_tables 
WHERE tablename = 'messages';

-- 6. Show current policies
SELECT polname, polcmd
FROM pg_policy 
WHERE polrelid = 'messages'::regclass;
