-- Simple Realtime diagnostic
-- Run this to check the key settings

-- 1. Check if messages table is in realtime publication
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'messages'
    ) THEN 'messages table IS in supabase_realtime publication ✅'
    ELSE 'messages table is NOT in supabase_realtime publication ❌'
  END as publication_status;

-- 2. Show all tables in realtime publication
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- 3. Check RLS status on messages table
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN 'RLS is ENABLED ✅'
    ELSE 'RLS is DISABLED ❌'
  END as rls_status
FROM pg_tables 
WHERE tablename = 'messages';

-- 4. Count messages in table
SELECT COUNT(*) as total_messages FROM messages;
