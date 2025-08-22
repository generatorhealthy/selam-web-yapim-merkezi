-- Enable realtime on website_analytics and ensure replica identity
-- Safe to run multiple times
DO $$ BEGIN
  -- Set replica identity to FULL for complete row data in updates
  EXECUTE 'ALTER TABLE public.website_analytics REPLICA IDENTITY FULL';
EXCEPTION WHEN others THEN
  -- Ignore if table doesn't exist yet or already set
  NULL;
END $$;

DO $$ BEGIN
  -- Add table to supabase_realtime publication if not present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'website_analytics'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.website_analytics';
  END IF;
EXCEPTION WHEN others THEN
  -- Ignore if lacking privileges or already added
  NULL;
END $$;