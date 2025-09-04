-- Simple migration script for Supabase
-- Run this in your Supabase SQL Editor

-- Add the requiresApproval column to groups table
ALTER TABLE groups ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT FALSE;

-- Create join_requests table
CREATE TABLE IF NOT EXISTS join_requests (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, group_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_join_requests_user_id ON join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_group_id ON join_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON join_requests(status);

-- Verify the changes
SELECT 'Migration completed successfully!' as status;
