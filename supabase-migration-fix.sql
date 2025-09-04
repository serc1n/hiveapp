-- =============================================
-- SUPABASE MIGRATION SCRIPT - RUN THIS IN YOUR SUPABASE SQL EDITOR
-- =============================================

-- First, let's check if the columns already exist to avoid errors
DO $$
BEGIN
    -- Add requires_approval column to groups table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'groups' AND column_name = 'requires_approval'
    ) THEN
        ALTER TABLE groups ADD COLUMN requires_approval BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added requires_approval column to groups table';
    ELSE
        RAISE NOTICE 'Column requires_approval already exists in groups table';
    END IF;
END $$;

-- Create join_requests table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'join_requests') THEN
        CREATE TABLE join_requests (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            user_id TEXT NOT NULL,
            group_id TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            CONSTRAINT fk_join_requests_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            CONSTRAINT fk_join_requests_group FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
            CONSTRAINT unique_user_group_request UNIQUE (user_id, group_id)
        );

        -- Create indexes for better performance
        CREATE INDEX idx_join_requests_user_id ON join_requests (user_id);
        CREATE INDEX idx_join_requests_group_id ON join_requests (group_id);
        CREATE INDEX idx_join_requests_status ON join_requests (status);

        RAISE NOTICE 'Created join_requests table with indexes';
    ELSE
        RAISE NOTICE 'Table join_requests already exists';
    END IF;
END $$;

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to update updated_at on join_requests if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'join_requests') THEN
        -- Drop trigger if it exists and recreate it
        DROP TRIGGER IF EXISTS update_join_requests_updated_at ON join_requests;
        CREATE TRIGGER update_join_requests_updated_at 
            BEFORE UPDATE ON join_requests 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created/updated trigger for join_requests.updated_at';
    END IF;
END $$;

-- Verify the migration
DO $$
BEGIN
    -- Check if requires_approval column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'groups' AND column_name = 'requires_approval'
    ) THEN
        RAISE NOTICE '✅ groups.requires_approval column exists';
    ELSE
        RAISE NOTICE '❌ groups.requires_approval column missing';
    END IF;

    -- Check if join_requests table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'join_requests') THEN
        RAISE NOTICE '✅ join_requests table exists';
    ELSE
        RAISE NOTICE '❌ join_requests table missing';
    END IF;
END $$;

-- Show final status
SELECT 
    'Migration completed! Check the messages above for status.' as status,
    NOW() as completed_at;
