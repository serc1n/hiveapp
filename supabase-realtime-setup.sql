-- Complete Supabase Realtime setup for messages table
-- Run this in Supabase SQL Editor

-- 1. Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 2. Grant necessary permissions for realtime
GRANT SELECT ON messages TO anon;
GRANT SELECT ON messages TO authenticated;
GRANT SELECT ON users TO anon;
GRANT SELECT ON users TO authenticated;

-- 3. Enable Row Level Security (RLS) on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 4. Create policy to allow users to read messages from groups they're members of
CREATE POLICY "Users can read messages from their groups" ON messages
FOR SELECT USING (
  groupId IN (
    SELECT groupId 
    FROM group_members 
    WHERE userId = auth.uid()::text
  )
);

-- 5. Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 6. Create policy to allow reading user profiles
CREATE POLICY "Users can read user profiles" ON users
FOR SELECT USING (true);

-- 7. Verify the publication includes our table
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- 8. Check if realtime is enabled
SELECT * FROM pg_stat_replication;
