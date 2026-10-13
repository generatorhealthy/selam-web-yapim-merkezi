DO $$
BEGIN
  UPDATE public.user_profiles
  SET name = 'AleynaAkpinar'
  WHERE user_id = '00891498-8c6b-4686-9b6c-e1eb6a227bba'
    AND name = 'BegumBal';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expected user name not found; no changes applied';
  END IF;
END $$;