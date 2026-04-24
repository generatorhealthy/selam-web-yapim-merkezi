ALTER TABLE public.social_shares DROP CONSTRAINT IF EXISTS social_shares_platform_check;
ALTER TABLE public.social_shares ADD CONSTRAINT social_shares_platform_check 
  CHECK (platform = ANY (ARRAY['twitter'::text, 'linkedin'::text, 'pinterest'::text, 'ghost'::text, 'kooplog'::text, 'tumblr'::text, 'hashnode'::text]));