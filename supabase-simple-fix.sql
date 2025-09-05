-- Simple Supabase Realtime permissions fix
-- Run this in Supabase SQL Editor

-- Grant necessary permissions for realtime
GRANT SELECT ON messages TO anon;
GRANT SELECT ON messages TO authenticated;
GRANT SELECT ON users TO anon;
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON group_members TO anon;
GRANT SELECT ON group_members TO authenticated;

-- Verify the publication includes our table
SELECT 'messages table in realtime:' as status, 
       CASE WHEN EXISTS (
           SELECT 1 FROM pg_publication_tables 
           WHERE pubname = 'supabase_realtime' 
           AND tablename = 'messages'
       ) THEN 'YES ✅' ELSE 'NO ❌' END as included;

-- Show all tables in realtime publication
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
