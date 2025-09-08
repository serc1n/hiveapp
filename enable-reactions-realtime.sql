-- Enable Realtime for message_reactions table
ALTER PUBLICATION supabase_realtime ADD TABLE "message_reactions";

-- Create RLS policy for message_reactions table to allow Realtime
CREATE POLICY "Allow Realtime for message_reactions" ON "message_reactions"
FOR ALL USING (true);

-- Make sure RLS is enabled
ALTER TABLE "message_reactions" ENABLE ROW LEVEL SECURITY;
