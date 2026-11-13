CREATE TABLE public.appointment_delivery_claims (
 appointment_id uuid NOT NULL REFERENCES public.appointments(id),
 channel text NOT NULL,
 status text NOT NULL DEFAULT 'claimed',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (appointment_id, channel)
);
GRANT ALL ON public.appointment_delivery_claims TO service_role;
ALTER TABLE public.appointment_delivery_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service manages appointment delivery claims" ON public.appointment_delivery_claims FOR ALL TO service_role USING (true) WITH CHECK (true);
COMMENT ON TABLE public.appointment_delivery_claims IS 'Consumed before provider access; unknown delivery never automatically retried. No backfill of historical appointments.';