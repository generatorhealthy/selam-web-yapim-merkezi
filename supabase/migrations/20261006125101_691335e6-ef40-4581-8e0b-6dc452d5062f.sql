CREATE TABLE public.registration_followups (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'aranmadi',
  note text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registration_followups TO authenticated;
GRANT ALL ON public.registration_followups TO service_role;
ALTER TABLE public.registration_followups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Yalnizca admin takip kayitlarini yonetir" ON public.registration_followups
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

CREATE OR REPLACE FUNCTION public.get_incomplete_registrations(p_days int DEFAULT 30)
RETURNS TABLE(user_id uuid, name text, email text, phone text, created_at timestamptz,
  reminders_sent int, status text, note text, followup_updated_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles x WHERE x.user_id = auth.uid() AND x.role = 'admin') THEN
    RAISE EXCEPTION 'yetkisiz';
  END IF;
  RETURN QUERY
  SELECT up.user_id, up.name::text, up.email::text, up.phone::text, up.created_at,
    (SELECT count(*)::int FROM public.registration_reminders r WHERE r.user_id = up.user_id),
    COALESCE(f.status, 'aranmadi'), f.note, f.updated_at
  FROM public.user_profiles up
  LEFT JOIN public.registration_followups f ON f.user_id = up.user_id
  WHERE up.role = 'specialist' AND COALESCE(up.is_approved,false) = false
    AND up.phone IS NOT NULL AND up.phone <> ''
    AND up.created_at >= now() - make_interval(days => p_days)
    AND NOT EXISTS (SELECT 1 FROM public.specialists s WHERE s.user_id = up.user_id)
  ORDER BY up.created_at DESC;
END $$;
REVOKE ALL ON FUNCTION public.get_incomplete_registrations(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_incomplete_registrations(int) TO authenticated;