-- Check current RLS status on messages table
SELECT 
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity THEN 'RLS is ENABLED ❌ (may block Realtime)'
    ELSE 'RLS is DISABLED ✅ (Realtime should work)'
  END as rls_status
FROM pg_tables 
WHERE tablename = 'messages';
