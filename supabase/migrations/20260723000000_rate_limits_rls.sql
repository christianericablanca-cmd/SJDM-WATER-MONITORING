-- Enable RLS on rate_limits table
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Only the service_role (server-side) should access rate_limits
-- Block all public/anonymous access via the Supabase Data API
CREATE POLICY "block_public_access" ON rate_limits
  FOR ALL
  USING (false)
  WITH CHECK (false);
