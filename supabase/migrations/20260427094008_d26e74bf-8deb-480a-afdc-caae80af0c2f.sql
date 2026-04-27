-- 1) social_shares.platform CHECK constraint'ine mastodon ekle
ALTER TABLE public.social_shares DROP CONSTRAINT IF EXISTS social_shares_platform_check;
ALTER TABLE public.social_shares ADD CONSTRAINT social_shares_platform_check
  CHECK (platform = ANY (ARRAY['twitter','linkedin','pinterest','ghost','kooplog','tumblr','hashnode','mastodon']));

-- 2) Backfill: Mastodon'da zaten paylaşılmış olan en eski 51 blog için social_shares kaydı oluştur
-- Böylece sistem tekrar baştan paylaşmaz, 52. yazıdan devam eder
INSERT INTO public.social_shares (blog_post_id, platform, status, shared_at, updated_at)
SELECT id, 'mastodon', 'success', now(), now()
FROM public.blog_posts
WHERE status = 'published'
ORDER BY created_at ASC
LIMIT 51
ON CONFLICT (blog_post_id, platform) DO NOTHING;