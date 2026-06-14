CREATE TABLE public.freepbx_extensions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid,
  customer_name text NOT NULL,
  customer_phone text,
  customer_email text,
  extension text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.freepbx_extensions TO authenticated;
GRANT ALL ON public.freepbx_extensions TO service_role;

ALTER TABLE public.freepbx_extensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view freepbx extensions"
ON public.freepbx_extensions
FOR SELECT
TO authenticated
USING (true);

CREATE UNIQUE INDEX freepbx_extensions_order_id_key ON public.freepbx_extensions (order_id) WHERE order_id IS NOT NULL;
CREATE UNIQUE INDEX freepbx_extensions_extension_key ON public.freepbx_extensions (extension);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_freepbx_extensions_updated_at
BEFORE UPDATE ON public.freepbx_extensions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();