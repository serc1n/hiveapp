-- Fix Supabase Realtime setup (skip already configured parts)
-- Run this in Supabase SQL Editor

-- 1. Grant necessary permissions for realtime (if not already done)
GRANT SELECT ON messages TO anon;
GRANT SELECT ON messages TO authenticated;
GRANT SELECT ON users TO anon;
GRANT SELECT ON users TO authenticated;

-- 2. Check if RLS is enabled on messages table, if not enable it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'messages' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 3. Drop existing policies if they exist and create new ones
DROP POLICY IF EXISTS "Users can read messages from their groups" ON messages;
DROP POLICY IF EXISTS "Users can read user profiles" ON users;

-- 4. Create policy to allow users to read messages from groups they're members of
CREATE POLICY "Users can read messages from their groups" ON messages
FOR SELECT USING (
  "groupId" IN (
    SELECT "groupId" 
    FROM group_members 
    WHERE "userId" = auth.uid()::text
  )
);

-- 5. Enable RLS on users table if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 6. Create policy to allow reading user profiles
CREATE POLICY "Users can read user profiles" ON users
FOR SELECT USING (true);

-- 7. Verify the publication includes our table
SELECT 'messages table in realtime:' as status, 
       CASE WHEN EXISTS (
           SELECT 1 FROM pg_publication_tables 
           WHERE pubname = 'supabase_realtime' 
           AND tablename = 'messages'
       ) THEN 'YES ✅' ELSE 'NO ❌' END as included;

-- 8. Show all tables in realtime publication
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
