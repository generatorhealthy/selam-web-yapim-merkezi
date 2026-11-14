CREATE TABLE public.order_document_delivery_claims (order_id uuid NOT NULL REFERENCES public.orders(id), content_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(order_id,content_hash));
GRANT ALL ON public.order_document_delivery_claims TO service_role;
ALTER TABLE public.order_document_delivery_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_only ON public.order_document_delivery_claims FOR ALL TO service_role USING(true) WITH CHECK(true);