CREATE TABLE public.lead_ivr_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid,
  cli text NOT NULL,
  total integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'creating',
  verimor_campaign_id text,
  webhook_token_hash text NOT NULL,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.lead_ivr_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.lead_ivr_campaigns(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.danisan_basvurulari(id) ON DELETE CASCADE,
  phone text NOT NULL,
  area_key text NOT NULL,
  digit text,
  call_status text,
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, lead_id),
  UNIQUE (campaign_id, phone)
);
CREATE TABLE public.lead_ivr_announcements (
  key text PRIMARY KEY,
  text text NOT NULL,
  voice_id text NOT NULL,
  announcement_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lead_ivr_campaigns, public.lead_ivr_calls, public.lead_ivr_announcements TO authenticated;
GRANT ALL ON public.lead_ivr_campaigns, public.lead_ivr_calls, public.lead_ivr_announcements TO service_role;
ALTER TABLE public.lead_ivr_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_ivr_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_ivr_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/staff read ivr campaigns" ON public.lead_ivr_campaigns FOR SELECT TO authenticated USING (public.is_admin_or_staff_user());
CREATE POLICY "Admin/staff read ivr calls" ON public.lead_ivr_calls FOR SELECT TO authenticated USING (public.is_admin_or_staff_user());
CREATE POLICY "Admin/staff read ivr announcements" ON public.lead_ivr_announcements FOR SELECT TO authenticated USING (public.is_admin_or_staff_user());
CREATE INDEX lead_ivr_calls_lead_idx ON public.lead_ivr_calls(lead_id);