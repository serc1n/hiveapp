-- Enable Realtime for GroupMember table
ALTER PUBLICATION supabase_realtime ADD TABLE "GroupMember";

-- Create RLS policy for GroupMember table to allow Realtime
CREATE POLICY "Allow Realtime for GroupMember" ON "GroupMember"
FOR ALL USING (true);

-- Make sure RLS is enabled
ALTER TABLE "GroupMember" ENABLE ROW LEVEL SECURITY;
