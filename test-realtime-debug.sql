-- Debug Supabase Realtime setup
-- Run this to check if everything is configured correctly

-- 1. Check if messages table exists and has data
SELECT 'Messages table check:' as info;
SELECT COUNT(*) as total_messages FROM messages;

-- 2. Check if messages table is in the realtime publication
SELECT 'Realtime publication check:' as info;
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'messages'
    ) THEN 'messages table IS in supabase_realtime publication ✅'
    ELSE 'messages table is NOT in supabase_realtime publication ❌'
  END as status;

-- 3. Show all tables in realtime publication
SELECT 'All tables in supabase_realtime publication:' as info;
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- 4. Check RLS policies on messages table
SELECT 'RLS policies on messages table:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'messages';

-- 5. Show current RLS policies
SELECT 'Current policies:' as info;
SELECT polname, polcmd, polroles::text
FROM pg_policy 
WHERE polrelid = 'messages'::regclass;

-- 6. Test permissions - try to select from messages as different roles
SELECT 'Permission test - can we select messages?:' as info;
SELECT 'Testing SELECT permission...' as test;

-- 7. Check if realtime is enabled at database level
SELECT 'Database realtime settings:' as info;
SELECT name, setting 
FROM pg_settings 
WHERE name LIKE '%wal%' OR name LIKE '%replica%'
ORDER BY name;
