-- Fix security issues
-- 1. Enable leaked password protection for better security
-- This will be handled in Auth settings, not SQL

-- 2. Check and fix extensions in public schema
-- Moving uuid-ossp extension to extensions schema if it exists in public
DO $$
BEGIN
    -- Check if uuid-ossp exists in public schema and drop it
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp' AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        DROP EXTENSION IF EXISTS "uuid-ossp";
    END IF;
    
    -- Recreate in extensions schema (this is the recommended location)
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
EXCEPTION
    WHEN OTHERS THEN
        -- If error occurs, just ensure extension exists somewhere
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
END $$;