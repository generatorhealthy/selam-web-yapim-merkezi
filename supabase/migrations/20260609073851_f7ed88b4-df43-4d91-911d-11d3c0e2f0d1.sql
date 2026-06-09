DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule(20);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'job 20 unschedule failed: %', SQLERRM;
  END;
  BEGIN
    PERFORM cron.unschedule(21);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'job 21 unschedule failed: %', SQLERRM;
  END;
END $$;