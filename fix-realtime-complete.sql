-- Complete fix for Supabase Realtime
-- Run this in Supabase SQL Editor

-- 1. First, let's check what's currently in the publication
SELECT 'Current tables in supabase_realtime publication:' as info;
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- 2. Remove messages from publication if it exists (to clean up)
DO $$ 
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE messages;
    EXCEPTION
        WHEN undefined_table THEN
            -- Table not in publication, that's fine
            NULL;
    END;
END $$;

-- 3. Add messages table back to publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 4. Enable Row Level Security on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 5. Create a simple policy that allows all authenticated users to SELECT
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON messages;
CREATE POLICY "Enable read access for authenticated users" ON messages
FOR SELECT USING (auth.role() = 'authenticated');

-- 6. Grant necessary permissions
GRANT SELECT ON messages TO authenticated;
GRANT SELECT ON messages TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 7. Also grant permissions on related tables
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON users TO anon;
GRANT SELECT ON groups TO authenticated;
GRANT SELECT ON groups TO anon;

-- 8. Check the publication again
SELECT 'Tables in supabase_realtime publication after fix:' as info;
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- 9. Test that we can select from messages (should return some data)
SELECT 'Sample messages (last 3):' as info;
SELECT id, content, "userId", "groupId", "createdAt"
FROM messages 
ORDER BY "createdAt" DESC 
LIMIT 3;
