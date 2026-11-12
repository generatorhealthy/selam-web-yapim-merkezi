CREATE TABLE public.consent_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  consumed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.consent_transactions TO service_role;

ALTER TABLE public.consent_transactions ENABLE ROW LEVEL SECURITY;

-- No policies: only the service role (edge functions) can read or write tokens.
-- Anonymous and authenticated clients have no direct table access.

CREATE INDEX consent_transactions_expires_at_idx ON public.consent_transactions (expires_at);

COMMENT ON TABLE public.consent_transactions IS 'Server-issued single-use tokens proving an anonymous visitor consent transaction was initiated server-side. Tokens are random, stored hashed, expire after 15 minutes and are consumed atomically.';