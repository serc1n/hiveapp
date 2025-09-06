-- Enable Realtime for groups table (for group deletions)
BEGIN;

-- Add groups table to the publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'groups'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE groups;
    RAISE NOTICE 'Added groups table to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'groups table already in supabase_realtime publication';
  END IF;
END $$;

-- Ensure RLS is enabled for groups table
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Create a policy for realtime access (allow authenticated users to see group changes)
DROP POLICY IF EXISTS "Allow realtime access to groups for authenticated users" ON groups;
CREATE POLICY "Allow realtime access to groups for authenticated users"
  ON groups FOR ALL
  TO authenticated
  USING (true);

COMMIT;

-- Check the setup
SELECT 'Groups table in publication:' as status, 
  EXISTS(
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'groups'
  ) as enabled;

SELECT 'Groups RLS enabled:' as status, 
  relrowsecurity as enabled
FROM pg_class 
WHERE relname = 'groups';
