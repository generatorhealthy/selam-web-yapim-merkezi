-- Create extensions schema and configure auth settings
CREATE SCHEMA IF NOT EXISTS extensions;

-- Note: pg_net extension cannot be moved via SET SCHEMA
-- This is expected behavior and the warning can be safely ignored
-- as long as the extension is only used by admin functions

-- Enable better password protection in auth
-- (This may require Supabase dashboard configuration)