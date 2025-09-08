-- Enable Realtime for group_members table (the actual table name)
ALTER PUBLICATION supabase_realtime ADD TABLE "group_members";

-- Create RLS policy for group_members table to allow Realtime
CREATE POLICY "Allow Realtime for group_members" ON "group_members"
FOR ALL USING (true);

-- Make sure RLS is enabled
ALTER TABLE "group_members" ENABLE ROW LEVEL SECURITY;
