-- Enable Realtime for messages table
-- This needs to be run in Supabase SQL Editor

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Grant necessary permissions for realtime
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO authenticated;

-- Create a function to get user data for messages (for better performance)
CREATE OR REPLACE FUNCTION get_message_with_user(message_row messages)
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'id', message_row.id,
    'content', message_row.content,
    'userId', message_row.userId,
    'groupId', message_row.groupId,
    'createdAt', message_row.createdAt,
    'user', (
      SELECT json_build_object(
        'id', u.id,
        'name', u.name,
        'twitterHandle', u.twitterHandle,
        'profileImage', u.profileImage
      )
      FROM users u
      WHERE u.id = message_row.userId
    )
  );
END;
$$ LANGUAGE plpgsql;
