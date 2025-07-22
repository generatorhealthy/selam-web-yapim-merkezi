-- Check which extensions are in public schema and address them
DO $$
DECLARE
    ext_record RECORD;
BEGIN
    -- List all extensions in public schema
    FOR ext_record IN 
        SELECT e.extname 
        FROM pg_extension e 
        JOIN pg_namespace n ON e.extnamespace = n.oid 
        WHERE n.nspname = 'public'
    LOOP
        -- Drop extension from public and recreate in extensions schema
        EXECUTE format('DROP EXTENSION IF EXISTS %I CASCADE', ext_record.extname);
        EXECUTE format('CREATE EXTENSION IF NOT EXISTS %I SCHEMA extensions', ext_record.extname);
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail
        RAISE NOTICE 'Could not move extensions: %', SQLERRM;
END $$;