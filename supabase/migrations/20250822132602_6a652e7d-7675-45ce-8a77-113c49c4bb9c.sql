-- Enable realtime for website_analytics and stabilize upserts
-- 1) Ensure a unique index on session_id for proper upsert behavior
CREATE UNIQUE INDEX IF NOT EXISTS website_analytics_session_id_key
ON public.website_analytics (session_id);

-- 2) Ensure full row data is emitted for updates
ALTER TABLE public.website_analytics REPLICA IDENTITY FULL;

-- 3) Add table to supabase_realtime publication if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'website_analytics'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.website_analytics';
  END IF;
END $$;